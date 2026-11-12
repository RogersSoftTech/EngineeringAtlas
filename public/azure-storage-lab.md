# Your Azure storage learning exercise

The app you are using is the example. It saves notes, progress and imported course replies in a private Azure Blob container, while keeping a device copy for interruptions.

## 1. Trace a save

Open a module, write a short note and watch the cloud status. It moves from **Saved on device · syncing** to **Saved to Azure**. In browser developer tools, inspect the request to `/api/learning/progress`.

The request contains your progress JSON and a version condition. It does not contain an Azure Storage account key. The browser sends its existing sign-in cookie to the same website.

**Exercise:** Find the `If-Match` header after a second save. Compare it with the version returned by the first save.

## 2. Understand the trust boundary

Azure Static Web Apps checks your sign-in and the invited `atlas_reader` role. It forwards a verified client principal to the managed .NET API. The API checks the role again and derives a storage prefix from the provider and user ID. A user ID supplied in the request body never chooses the storage location.

The API is a managed function behind Static Web Apps. Do not copy this header-trust pattern to an independently exposed public server without adding real token verification.

**Exercise:** Follow `AtlasUser.FromPrincipal` in `api/Identity.cs`. Why is `userDetails` a poor choice for a durable storage partition key?

## 3. Inspect the document model

The storage account is `statlaslearne76c5290`. Its private container is `learning-data`.

```text
learning-data/
  users/
    <hash of provider and app-specific user ID>/
      progress.json
      courses/
        <conversation-id>.json
```

One progress document holds roadmap and course-section notes, completion, confidence and reading positions. Each imported course is a separate document, so saving a note does not rewrite all course text. A second account has a separate prefix.

**Exercise:** In Azure Portal, locate the storage account and container. After a confirmed save, inspect your progress JSON using your authorized Azure account. Compare it with **Export my progress**.

## 4. Why Blob Storage?

These records are complete JSON documents, and the app usually reads or replaces an entire document. Blob Storage is a small, understandable fit for that access pattern. It also supports conditional writes using ETags.

A relational database would be a stronger fit for joins and transactional reporting. A document database would become useful for richer queries, fine-grained document operations, or larger multi-user workloads. Azure Table Storage could fit many small keyed records. Storage choice follows access patterns, not just the fact that JSON is involved.

## 5. Reproduce a conflict

Open the same account in two browser profiles. Read the same progress version on both, then edit and save on the first. Make a conflicting edit on the second before it refreshes.

Azure rejects the stale write rather than replacing the newer document. The second browser keeps its local copy and asks which version to use. Export a progress backup before intentionally discarding either version.

**Exercise:** Observe HTTP `409` and compare both ETags. Explain why checking a version before writing is insufficient unless the check and write are enforced atomically by storage.

## 6. Work through an interruption

With the app already open, use developer tools to go offline and edit a note. The device copy is retained and the status says Azure sync is pending. Reconnect and select **Sync now**.

This is an offline queue, not a promise that a fresh browser can open the entire website without internet. Wait for **Saved to Azure** before relying on a change being available on another device. Closing before upload leaves a pending device copy that retries when that same browser reopens.

**Exercise:** Which failures happen before the request, after the write but before the response, and during a retry? How do conditional writes change the recovery behavior?

## 7. Migrate your earlier browser data

When the app offers **Upload browser data to my account**, it has found notes or imported courses stored before cloud saving was introduced. Choose this once from the browser and website address that contains that earlier work. The app asks before replacing matching cloud records and retains the old browser copies.

Imports selected through **Course library** save to Azure after this upgrade. On another device, sign into the same invited account and open the library. Browser cache keys are scoped by account, so another signed-in account does not inherit your local notes.

Your Azure identity is specific to this Static Web App. Removing and reinviting a user creates a new app-specific user ID; an administrator must deliberately migrate existing data if that happens. Notes are not automatically merged between different Static Web App resources.

## 8. Keep secrets on the server

The storage connection string is an Azure API application setting. It is not in Angular, the repository, the deployment artifact, or a request from the browser. The storage account disallows public blob access and requires HTTPS. Seven-day blob soft deletion helps recover accidental overwrites or deletion; it is not a complete backup strategy.

Managed Static Web Apps APIs have limited managed-identity support. This implementation uses a server-side connection string. A useful follow-up exercise is a separately hosted API with managed identity and narrowly scoped Blob Data permissions. That changes both the deployment architecture and operational cost.

**Exercise:** Describe how you would rotate the storage key without exposing it to the browser. Then compare this Azure design with an AWS design using CloudFront, API Gateway/Lambda, identity tokens, and private S3 objects.

## Suggested review

- What authenticates a request, and what authorizes the invited role?
- Which component chooses the user partition?
- What is actually atomic in a save?
- What happens when two devices write at once?
- Where does an offline change live before upload?
- What changes would you need for shared team notes or real-time collaborative editing?

Source guides: [Static Web Apps user information](https://learn.microsoft.com/azure/static-web-apps/user-information), [Blob Storage concurrency](https://learn.microsoft.com/azure/storage/blobs/concurrency-manage), and [the .NET isolated worker model](https://learn.microsoft.com/azure/azure-functions/dotnet-isolated-process-guide).
