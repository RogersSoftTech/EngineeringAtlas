using System.Text.Json;
using System.Text.RegularExpressions;

namespace EngineeringAtlas.Api;

public static class Contracts
{
    public static readonly HashSet<string> CourseIds = JsonSerializer.Deserialize<string[]>(typeof(Contracts).Assembly.GetManifestResourceStream("course-ids.json")!)!.ToHashSet();
    private static readonly HashSet<string> ModuleIds = Enumerable.Range(0,13).SelectMany(t => Enumerable.Range(0,3).Select(m => $"t{t}m{m}")).ToHashSet();
    public const int MaxBytes = 5_000_000;

    public static void ValidateCourse(JsonElement value, string id)
    {
        Check(CourseIds.Contains(id), "Unknown course.");
        Check(value.ValueKind == JsonValueKind.Object && value.TryGetProperty("id",out var courseId) && courseId.ValueKind==JsonValueKind.String && courseId.GetString()==id,"Invalid course ID.");
        Check(value.TryGetProperty("messages",out var messages) && messages.ValueKind==JsonValueKind.Array && messages.GetArrayLength() is >0 and <=500,"Invalid course messages.");
        foreach(var message in messages.EnumerateArray())
        {
            Check(message.ValueKind==JsonValueKind.Object,"Invalid course message.");
            Text(message,"id",256,true); Text(message,"markdown",1_000_000,true);
            if(message.TryGetProperty("truncated",out var flag))Check(flag.ValueKind is JsonValueKind.True or JsonValueKind.False,"Invalid completeness flag.");
        }
    }

    public static void ValidateState(JsonElement state)
    {
        Check(state.ValueKind==JsonValueKind.Object,"Invalid workspace.");
        Check(state.TryGetProperty("version",out var version) && version.ValueKind==JsonValueKind.Number && version.TryGetInt32(out var v) && v==1,"Unsupported workspace version.");
        Check(state.TryGetProperty("mode",out var mode) && mode.ValueKind==JsonValueKind.String && mode.GetString() is "learning" or "interview","Invalid study mode.");
        Check(state.TryGetProperty("records",out var records) && records.ValueKind==JsonValueKind.Object,"Invalid progress records.");
        Check(records.EnumerateObject().Count()<=ModuleIds.Count*2,"Too many roadmap records.");
        foreach(var record in records.EnumerateObject())
        {
            var parts=record.Name.Split(':');
            Check(parts.Length==2 && parts[0] is "learning" or "interview" && ModuleIds.Contains(parts[1]),"Unknown roadmap record.");
            ValidateRecord(record.Value);
        }
        if(state.TryGetProperty("courseRecords",out var courses))
        {
            Check(courses.ValueKind==JsonValueKind.Object && courses.EnumerateObject().Count()<=5000,"Invalid course records.");
            foreach(var record in courses.EnumerateObject())
            {
                var parts=record.Name.Split('/');
                Check(parts.Length==2 && CourseIds.Contains(parts[0]) && Regex.IsMatch(parts[1],"^[a-z0-9-]{1,140}$"),"Unknown course record.");
                ValidateRecord(record.Value);
            }
        }
        if(state.TryGetProperty("last",out var last))Check(last.ValueKind==JsonValueKind.Null || last.ValueKind==JsonValueKind.String && ModuleIds.Contains(last.GetString()!),"Invalid reading position.");
        if(state.TryGetProperty("courseLast",out var courseLast) && courseLast.ValueKind!=JsonValueKind.Null)
        {
            Check(courseLast.ValueKind==JsonValueKind.Object,"Invalid course position.");
            Text(courseLast,"courseId",100,true);Text(courseLast,"chapterId",140,true);
            Check(CourseIds.Contains(courseLast.GetProperty("courseId").GetString()!) && Regex.IsMatch(courseLast.GetProperty("chapterId").GetString()!,"^[a-z0-9-]{1,140}$"),"Invalid course position.");
        }
    }

    private static void ValidateRecord(JsonElement record)
    {
        Check(record.ValueKind==JsonValueKind.Object,"Invalid progress record.");
        foreach(var name in new[]{"notes","work","takeaway"})Text(record,name,100_000,false);
        foreach(var name in new[]{"started","done"})if(record.TryGetProperty(name,out var flag))Check(flag.ValueKind is JsonValueKind.True or JsonValueKind.False,"Invalid completion flag.");
        if(record.TryGetProperty("confidence",out var confidence))Check(confidence.ValueKind==JsonValueKind.Number && confidence.TryGetInt32(out var c) && c is >=0 and <=5,"Invalid confidence.");
        if(record.TryGetProperty("updated",out var updated))Check(updated.ValueKind==JsonValueKind.Number && updated.TryGetDouble(out var d) && double.IsFinite(d) && d>=0,"Invalid update time.");
    }
    private static void Text(JsonElement value,string key,int limit,bool required)
    {
        if(!value.TryGetProperty(key,out var item)){Check(!required,"Missing "+key);return;}
        Check(item.ValueKind==JsonValueKind.String && item.GetString()!.Length<=limit && (!required || item.GetString()!.Length>0),"Invalid "+key);
    }
    private static void Check(bool condition,string message){if(!condition)throw new ApiException(400,"INVALID_DATA",message);}
}
