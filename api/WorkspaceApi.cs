using System.Text.Json;

namespace EngineeringAtlas.Api;

public sealed record ApiInput(string Method,string Resource,string? Id,string? Principal,string? Owner,string? IfMatch,bool CreateOnly,JsonElement? Body);
public sealed record ApiOutput(int Status,object Body,string? Owner=null);

public sealed class WorkspaceApi(IUserBlobStore store)
{
    public async Task<ApiOutput> HandleAsync(ApiInput input,CancellationToken cancellationToken=default)
    {
        AtlasUser user;
        try
        {
            user=AtlasUser.FromPrincipal(input.Principal);
            if(input.Owner is not null && input.Owner!=user.Owner)throw new ApiException(409,"SESSION_CHANGED","The signed-in account changed. Reload before saving.");
            var resource=input.Resource;
            if(input.Method=="GET" && resource=="session")return new ApiOutput(200,new{owner=user.Owner,displayName=user.DisplayName,storage="azure-blob"},user.Owner);
            if(resource is not("progress" or "courses"))throw new ApiException(404,"NOT_FOUND","Unknown learning resource.");
            if(resource=="courses" && input.Id is not null && !Contracts.CourseIds.Contains(input.Id))throw new ApiException(404,"NOT_FOUND","Unknown course.");
            if(input.Method=="GET")
            {
                if(resource=="courses" && input.Id is null)return new ApiOutput(200,new{courses=await store.ListCoursesAsync(user.Owner,cancellationToken),owner=user.Owner},user.Owner);
                var value=await store.ReadAsync(user.Owner,resource,input.Id,cancellationToken);
                return resource=="progress"?new ApiOutput(200,new{state=value?.Document,etag=value?.Etag,owner=user.Owner},user.Owner):new ApiOutput(200,new{document=value?.Document,etag=value?.Etag,owner=user.Owner},user.Owner);
            }
            if(input.Method!="PUT")throw new ApiException(405,"METHOD_NOT_ALLOWED","Use GET or PUT.");
            if(input.Owner!=user.Owner)throw new ApiException(409,"SESSION_CHANGED","Reload your signed-in workspace before saving.");
            if(input.IfMatch is null && !input.CreateOnly || input.IfMatch is not null && input.CreateOnly)throw new ApiException(428,"VERSION_REQUIRED","A saved version is required before writing.");
            if(input.IfMatch is {Length:>512})throw new ApiException(400,"INVALID_VERSION","Invalid version.");
            if(input.Body is null)throw new ApiException(400,"INVALID_DATA","Missing document.");
            if(input.Body.Value.GetRawText().Length>Contracts.MaxBytes)throw new ApiException(413,"TOO_LARGE","This document is too large.");
            if(resource=="progress")Contracts.ValidateState(input.Body.Value);else if(input.Id is not null)Contracts.ValidateCourse(input.Body.Value,input.Id);else throw new ApiException(400,"INVALID_DATA","A course ID is required.");
            var etag=await store.WriteAsync(user.Owner,resource,input.Id,input.Body.Value,input.IfMatch,cancellationToken);
            return new ApiOutput(200,new{etag,owner=user.Owner},user.Owner);
        }
        catch(ApiException e){return new ApiOutput(e.Status,new{code=e.Code,message=e.Message});}
    }
}
