using System.Text;
using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EngineeringAtlas.Api;

var connection=Environment.GetEnvironmentVariable("ATLAS_STORAGE_CONNECTION_STRING")??throw new Exception("Use the configured Azure storage connection in the process environment.");
var userId="integration-test-"+Guid.NewGuid();
string Principal(string user)=>Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new{userId=user,identityProvider="github",userDetails="Storage smoke test",userRoles=new[]{"authenticated","atlas_reader"}})));
var principal=Principal(userId);var owner=AtlasUser.FromPrincipal(principal).Owner;
var store=new BlobUserStore(connection,"learning-data");var api=new WorkspaceApi(store);
JsonElement Body(ApiOutput result)=>JsonSerializer.SerializeToElement(result.Body,new JsonSerializerOptions(JsonSerializerDefaults.Web));
void Require(bool value,string message){if(!value)throw new Exception(message);}
var client=new BlobServiceClient(connection).GetBlobContainerClient("learning-data");
try
{
    var state=JsonSerializer.SerializeToElement(new{version=1,mode="learning",records=new{},last=(string?)null});
    var first=await api.HandleAsync(new ApiInput("PUT","progress",null,principal,owner,null,true,state));Require(first.Status==200,"Progress creation failed.");
    var etag=Body(first).GetProperty("etag").GetString();
    Require((await api.HandleAsync(new ApiInput("GET","progress",null,principal,owner,null,false,null))).Status==200,"Progress read failed.");
    Require((await api.HandleAsync(new ApiInput("PUT","progress",null,principal,owner,etag,false,state))).Status==200,"Conditional update failed.");
    Require((await api.HandleAsync(new ApiInput("PUT","progress",null,principal,owner,etag,false,state))).Status==409,"Stale update was not rejected.");
    var otherPrincipal=Principal("another-"+userId);var otherOwner=AtlasUser.FromPrincipal(otherPrincipal).Owner;
    var other=Body(await api.HandleAsync(new ApiInput("GET","progress",null,otherPrincipal,otherOwner,null,false,null)));Require(other.GetProperty("state").ValueKind==JsonValueKind.Null,"Account isolation failed.");
    var id=Contracts.CourseIds.First();var course=JsonSerializer.SerializeToElement(new{id,messages=new[]{new{id="smoke",markdown="Temporary storage integration test.",truncated=false}}});
    Require((await api.HandleAsync(new ApiInput("PUT","courses",id,principal,owner,null,true,course))).Status==200,"Course write failed.");
    Require(Body(await api.HandleAsync(new ApiInput("GET","courses",null,principal,owner,null,false,null))).GetProperty("courses").GetArrayLength()==1,"Course listing failed.");
    var properties=await client.GetPropertiesAsync();Require(properties.Value.PublicAccess==PublicAccessType.None,"Container permits public access.");
    Console.WriteLine("PASS: real Azure Blob reads, writes, course listing, private container, per-user isolation, and stale-write rejection.");
}
finally
{
    // This prefix belongs only to the random test identity allocated above.
    await foreach(var blob in client.GetBlobsAsync(BlobTraits.None,BlobStates.None,$"users/{owner}/",CancellationToken.None))await client.DeleteBlobIfExistsAsync(blob.Name);
}
