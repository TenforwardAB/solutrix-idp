import {
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} from "@azure/storage-blob";
/**
 * A wrapper class for Azure's BlockBlobClient that provides methods for interacting with blob storage.
 *
 * The class facilitates common blob operations such as uploading JSON, buffers, setting metadata, and downloading blob content.
 *
 * @class AzureBlockBlobClient
 * @param {BlockBlobClient} blockBlobClient - The Azure BlockBlobClient instance used for blob operations.
 *
 * Methods:
 * - setMetaData(metadata: any): Sets metadata for the blob.
 * - uploadJSON(entry: {}): Uploads a JSON object to the blob after stringifying it.
 * - uploadBuffer(buffer: Buffer): Uploads a buffer to the blob.
 * - downloadBuffer(): Downloads the blob's content as a buffer.
 *
 * Error handling:
 * - Throws an error if no readable stream is found during the `downloadBuffer` operation.
 */
export class AzureBlockBlobClient {
  private blockBlobClient: BlockBlobClient;
  constructor(blockBloblClient: BlockBlobClient) {
    this.blockBlobClient = blockBloblClient;
  }
  public setMetaData(metadata: any) {
    return this.blockBlobClient.setMetadata(metadata);
  }
  public uploadJSON(entry: {}) {
    return this.blockBlobClient.upload(
      JSON.stringify(entry, null, 4),
      Buffer.byteLength(JSON.stringify(entry))
    );
  }
  public uploadBuffer(buffer: Buffer) {
    return this.blockBlobClient.upload(buffer, buffer.length);
  }
  public async downloadBuffer(): Promise<Buffer> {
    const downloadBlockBlobResponse = await this.blockBlobClient.download();
    const chunks: Buffer[] = [];
    const readableStream = downloadBlockBlobResponse.readableStreamBody;
    if (!readableStream) {
      throw new Error(
        `No stream found for blockBlobClient: ${this.blockBlobClient}`
      );
    }
    return new Promise((resolve, reject) => {
      readableStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      readableStream.on("end", () => resolve(Buffer.concat(chunks)));
      readableStream.on("error", reject);
    });
  }
  public async downloadJSON() {
    let labsTracker: any = { versioning: [] };
    try {
      const downloadResponse = await this.blockBlobClient.download();
      const trackerContent =
        (await streamToString(downloadResponse.readableStreamBody!)) || "{}";
      labsTracker = JSON.parse(trackerContent);
    } catch (err) {
      console.error("Error when download tracker", err);
      throw err;
    }
    return labsTracker;
  }
}
async function streamToString(
  readableStream: NodeJS.ReadableStream
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8")); // Concatenate the chunks into a single string
    });
    readableStream.on("error", reject);
  });
}
/**
 * A service class for interacting with Azure Blob Storage.
 *
 * The class provides methods to upload files and retrieve block blob clients for specific blobs in a given container.
 *
 * @class AzureService
 * @param {string} connection_string - The connection string for the Azure storage account.
 * @param {string} containerName - The name of the container where blobs will be stored.
 *
 * Methods:
 * - uploadFile(fileContent: Buffer, uploadFileName: string): Uploads a file to the specified blob and returns an instance of AzureBlockBlobClient for further operations.
 * - getBlockBlobClient(blobName: string): Retrieves an AzureBlockBlobClient for the specified blob name, allowing for blob operations.
 */
export class AzureService {
  private containerClient: ContainerClient;
  constructor(connection_string: string, containerName: string) {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connection_string);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }
  public async uploadFile(fileContent: Buffer, uploadFileName: string) {
    const blockBlobClient =
      this.containerClient.getBlockBlobClient(uploadFileName);
    await blockBlobClient.upload(fileContent, fileContent.length);
    return new AzureBlockBlobClient(blockBlobClient);
  }
  public getBlockBlobClient(blobName: string) {
    return new AzureBlockBlobClient(
      this.containerClient.getBlockBlobClient(blobName)
    );
  }
}

