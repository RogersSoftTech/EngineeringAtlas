using System.Text;
using System.Text.Json;
using EngineeringAtlas.Api;
using Xunit;

public class WorkspaceTests
{
    public static string Principal(string id="alice",string[]? roles=null)=>Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new{userId=id,identityProvider="github",userDetails=id,userRoles=roles??["authenticated","atlas_reader"]})));
    public static JsonElement Json(object value)=>JsonSerializer.SerializeToElement(value);
    public static JsonElement Data()=>Json(new{version=1,mode="learning",records=new Dictionary<string,object>{{"learning:t0m0",new{notes="My architecture notes",done=true,confidence=4}}},last="t0m0"});
    private static JsonElement Body(ApiOutput output)=>JsonSerializer.SerializeToElement(output.Body,new JsonSerializerOptions(JsonSerializerDefaults.Web));
    private static ApiInput Input(string method="GET",string resource="progress",string user="alice",string? etag=null,JsonElement? data=null,bool create=false,string? id=null)=>new(method,resource,id,Principal(user),AtlasUser.FromPrincipal(Principal(user)).Owner,etag,create,data);

    [Fact] public async Task RejectsMissingIdentity(){var api=new WorkspaceApi(new FakeStore());Assert.Equal(401,(await api.HandleAsync(new ApiInput("GET","session",null,null,null,null,false,null))).Status);}
    [Fact] public async Task RejectsUninvitedUser(){var api=new WorkspaceApi(new FakeStore());Assert.Equal(403,(await api.HandleAsync(new ApiInput("GET","session",null,Principal(roles:["authenticated"]),null,null,false,null))).Status);}
    [Fact] public async Task RejectsMalformedPrincipal(){var api=new WorkspaceApi(new FakeStore());Assert.Equal(401,(await api.HandleAsync(new ApiInput("GET","session",null,"malformed",null,null,false,null))).Status);}
    [Fact] public async Task PartitionsDataByServerIdentity()
    {
        var api=new WorkspaceApi(new FakeStore());Assert.Equal(200,(await api.HandleAsync(Input("PUT",data:Data(),create:true))).Status);
        var alice=Body(await api.HandleAsync(Input()));var bob=Body(await api.HandleAsync(Input(user:"bob")));
        Assert.Equal("My architecture notes",alice.GetProperty("state").GetProperty("records").GetProperty("learning:t0m0").GetProperty("notes").GetString());Assert.Equal(JsonValueKind.Null,bob.GetProperty("state").ValueKind);
    }
    [Fact] public async Task PreventsWritesAfterAnAccountSwitch(){var api=new WorkspaceApi(new FakeStore());var stale=Input("PUT",data:Data(),create:true) with{Principal=Principal("bob")};Assert.Equal(409,(await api.HandleAsync(stale)).Status);}
    [Fact] public async Task RequiresVersionCondition(){var api=new WorkspaceApi(new FakeStore());Assert.Equal(428,(await api.HandleAsync(Input("PUT",data:Data()))).Status);}
    [Fact] public async Task PreventsLostUpdates()
    {
        var api=new WorkspaceApi(new FakeStore());var first=Body(await api.HandleAsync(Input("PUT",data:Data(),create:true)));var etag=first.GetProperty("etag").GetString();
        Assert.Equal(200,(await api.HandleAsync(Input("PUT",etag:etag,data:Data()))).Status);Assert.Equal(409,(await api.HandleAsync(Input("PUT",etag:etag,data:Data()))).Status);Assert.Equal(409,(await api.HandleAsync(Input("PUT",data:Data(),create:true))).Status);
    }
    [Fact] public async Task KeepsCourseListsPrivate()
    {
        var api=new WorkspaceApi(new FakeStore());var id=Contracts.CourseIds.First();var doc=Json(new{id,messages=new[]{new{id="m",markdown="# Full course\n\nComplete text",truncated=false}}});
        Assert.Equal(200,(await api.HandleAsync(Input("PUT","courses",data:doc,create:true,id:id))).Status);
        Assert.Single(Body(await api.HandleAsync(Input(resource:"courses"))).GetProperty("courses").EnumerateArray());Assert.Empty(Body(await api.HandleAsync(Input(resource:"courses",user:"bob"))).GetProperty("courses").EnumerateArray());
    }
    [Fact] public async Task RejectsUnknownCourses(){var api=new WorkspaceApi(new FakeStore());Assert.Equal(404,(await api.HandleAsync(Input(resource:"courses",id:"../other-user"))).Status);}
    [Theory]
    [InlineData("{\"version\":\"1\",\"mode\":\"learning\",\"records\":{}}")]
    [InlineData("{\"version\":1,\"mode\":\"other\",\"records\":{}}")]
    [InlineData("{\"version\":1,\"mode\":\"learning\",\"records\":{\"learning:t0m0\":{\"confidence\":\"4\"}}}")]
    [InlineData("{\"version\":1,\"mode\":\"learning\",\"records\":{\"learning:unknown\":{}}}")]
    public async Task ValidatesUntrustedDocuments(string text){var api=new WorkspaceApi(new FakeStore());Assert.Equal(400,(await api.HandleAsync(Input("PUT",data:JsonDocument.Parse(text).RootElement,create:true))).Status);}
    [Fact] public void UsesOpaqueStableUserPaths(){Assert.Equal(AtlasUser.FromPrincipal(Principal()).Owner,AtlasUser.FromPrincipal(Principal()).Owner);Assert.NotEqual(AtlasUser.FromPrincipal(Principal()).Owner,AtlasUser.FromPrincipal(Principal("bob")).Owner);Assert.Matches("^[a-f0-9]{64}$",AtlasUser.FromPrincipal(Principal()).Owner);}
    [Fact] public void ExposesTheManagedFunctionEntryPoint(){var function=typeof(WorkspaceFunctions).GetMethod("Run")!;Assert.Contains(function.GetCustomAttributes(false),a=>a is Microsoft.Azure.Functions.Worker.FunctionAttribute f&&f.Name=="LearningWorkspace");}
}

public sealed class FakeStore : IUserBlobStore
{
    private readonly Dictionary<string,StoredValue> records=[];
    public Task<StoredValue?> ReadAsync(string owner,string resource,string? id,CancellationToken token)=>Task.FromResult(records.GetValueOrDefault(owner+"/"+resource+"/"+id));
    public Task<string> WriteAsync(string owner,string resource,string? id,JsonElement document,string? expected,CancellationToken token)
    {
        lock(records){var key=owner+"/"+resource+"/"+id;var existing=records.GetValueOrDefault(key);if(existing?.Etag!=expected)throw new ApiException(409,"CONFLICT","Changed elsewhere");var etag="\""+Guid.NewGuid()+"\"";records[key]=new StoredValue(document.Clone(),etag);return Task.FromResult(etag);}
    }
    public Task<IReadOnlyList<CourseVersion>> ListCoursesAsync(string owner,CancellationToken token)=>Task.FromResult<IReadOnlyList<CourseVersion>>(records.Where(p=>p.Key.StartsWith(owner+"/courses/",StringComparison.Ordinal)).Select(p=>new CourseVersion(p.Key.Split('/')[2],p.Value.Etag)).ToList());
}
