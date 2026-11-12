using EngineeringAtlas.Api;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddSingleton<IUserBlobStore>(_ => new BlobUserStore(
            Environment.GetEnvironmentVariable("ATLAS_STORAGE_CONNECTION_STRING") ?? throw new InvalidOperationException("Storage is not configured."),
            Environment.GetEnvironmentVariable("ATLAS_STORAGE_CONTAINER") ?? "learning-data"));
        services.AddSingleton<WorkspaceApi>();
    }).Build();
host.Run();
