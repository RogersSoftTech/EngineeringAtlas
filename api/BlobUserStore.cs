using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using System.Text.Json;

namespace EngineeringAtlas.Api;

public sealed record StoredValue(JsonElement Document,string Etag);
public sealed record CourseVersion(string Id,string Etag);
public interface IUserBlobStore
{
    Task<StoredValue?> ReadAsync(string owner,string resource,string? id,CancellationToken cancellationToken);
    Task<string> WriteAsync(string owner,string resource,string? id,JsonElement document,string? expectedEtag,CancellationToken cancellationToken);
    Task<IReadOnlyList<CourseVersion>> ListCoursesAsync(string owner,CancellationToken cancellationToken);
}

public sealed class BlobUserStore(string connectionString,string container) : IUserBlobStore
{
    private readonly BlobContainerClient client = new BlobServiceClient(connectionString).GetBlobContainerClient(container);
    private static string Name(string owner,string resource,string? id) => $"users/{owner}/"+(resource=="progress"?"progress.json":$"courses/{id}.json");
    public async Task<StoredValue?> ReadAsync(string owner,string resource,string? id,CancellationToken cancellationToken)
    {
        try
        {
            var value=await client.GetBlobClient(Name(owner,resource,id)).DownloadContentAsync(cancellationToken);
            return new StoredValue(JsonDocument.Parse(value.Value.Content.ToMemory()).RootElement.Clone(),value.Value.Details.ETag.ToString());
        }
        catch(RequestFailedException e) when(e.Status==404){return null;}
    }
    public async Task<string> WriteAsync(string owner,string resource,string? id,JsonElement document,string? expectedEtag,CancellationToken cancellationToken)
    {
        try
        {
            var options=new BlobUploadOptions
            {
                Conditions=expectedEtag is null?new BlobRequestConditions{IfNoneMatch=ETag.All}:new BlobRequestConditions{IfMatch=new ETag(expectedEtag)},
                HttpHeaders=new BlobHttpHeaders{ContentType="application/json; charset=utf-8",CacheControl="private, no-store"},
                Metadata=resource=="courses"?new Dictionary<string,string>{{"courseid",id!}}:null
            };
            var value=await client.GetBlobClient(Name(owner,resource,id)).UploadAsync(BinaryData.FromString(document.GetRawText()),options,cancellationToken);
            return value.Value.ETag.ToString();
        }
        catch(RequestFailedException e) when(e.Status is 409 or 412){throw new ApiException(409,"CONFLICT","A newer version exists in Azure. Review it before replacing it.");}
    }
    public async Task<IReadOnlyList<CourseVersion>> ListCoursesAsync(string owner,CancellationToken cancellationToken)
    {
        var items=new List<CourseVersion>();
        await foreach(var blob in client.GetBlobsAsync(BlobTraits.None,BlobStates.None,$"users/{owner}/courses/",cancellationToken))
        {
            var id=Path.GetFileNameWithoutExtension(blob.Name);
            if(Contracts.CourseIds.Contains(id))items.Add(new CourseVersion(id,blob.Properties.ETag?.ToString()??""));
        }
        return items;
    }
}
