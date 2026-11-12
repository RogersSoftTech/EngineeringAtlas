using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace EngineeringAtlas.Api;

public sealed class WorkspaceFunctions(WorkspaceApi api,ILogger<WorkspaceFunctions> logger)
{
    private static readonly JsonSerializerOptions JsonOptions=new(JsonSerializerDefaults.Web);
    [Function("LearningWorkspace")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous,"get","put",Route="learning/{resource}/{id?}")] HttpRequestData request,string resource,string? id,FunctionContext context)
    {
        ApiOutput output;
        try
        {
            // Managed SWA injects this principal. The function is not exposed as an independent public API.
            var principal=Header(request,"x-ms-client-principal");
            AtlasUser.FromPrincipal(principal); // Reject unauthorized requests before reading a body.
            JsonElement? body=null;
            if(request.Method=="PUT")
            {
                if(!(Header(request,"Content-Type")??"").StartsWith("application/json",StringComparison.OrdinalIgnoreCase))throw new ApiException(415,"JSON_REQUIRED","Send a JSON document.");
                using var buffer=new MemoryStream();var chunk=new byte[8192];int read;
                while((read=await request.Body.ReadAsync(chunk,context.CancellationToken))>0){if(buffer.Length+read>Contracts.MaxBytes)throw new ApiException(413,"TOO_LARGE","This document is too large.");await buffer.WriteAsync(chunk.AsMemory(0,read),context.CancellationToken);}
                body=JsonDocument.Parse(buffer.ToArray()).RootElement.Clone();
            }
            output=await api.HandleAsync(new ApiInput(request.Method,resource,id,principal,Header(request,"X-Atlas-Owner"),Header(request,"If-Match"),Header(request,"If-None-Match")=="*",body),context.CancellationToken);
        }
        catch(ApiException e){output=new ApiOutput(e.Status,new{code=e.Code,message=e.Message});}
        catch(JsonException){output=new ApiOutput(400,new{code="INVALID_JSON",message="The document is not valid JSON."});}
        catch(Exception e){logger.LogError("Learning storage request failed ({Type}); invocation {InvocationId}.",e.GetType().Name,context.InvocationId);output=new ApiOutput(503,new{code="STORAGE_UNAVAILABLE",message="Azure storage is temporarily unavailable. Your browser copy is kept."});}
        var response=request.CreateResponse((HttpStatusCode)output.Status);
        response.Headers.Add("Content-Type","application/json; charset=utf-8");response.Headers.Add("Cache-Control","private, no-store");
        if(output.Owner is not null)response.Headers.Add("X-Atlas-Owner",output.Owner);
        await response.WriteStringAsync(JsonSerializer.Serialize(output.Body,JsonOptions));
        return response;
    }
    private static string? Header(HttpRequestData request,string name)=>request.Headers.TryGetValues(name,out var values)?values.FirstOrDefault():null;
}
