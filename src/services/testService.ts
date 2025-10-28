/**
 * Copyright (C) 2024 [TSEI].
 *
 * Created on 2024-09-07 :: 21:58 BY andrek [andre@tenforward.se]
 */
import * as tar from "tar-stream";
import { Readable } from "stream";
import * as zlib from "zlib";

interface TestResult {
  test_type: string;
  status: string;
  files: Record<string, string>;
}

interface Results {
  status: string;
  tests: TestResult[];
}

export class TestService {
  private stream: Readable;
  private extractedFiles: Record<string, Buffer> = {};
  private _results: Results = { status: "OK", tests: [] };

  constructor(stream: Readable) {
    this.stream = stream;
  }

  // New async initialization method to replace async constructor
  public async init(): Promise<void> {
    this.extractedFiles = await this._extractTarball();
  }

  get results(): Results {
    return this._results;
  }

  set results(value: Results) {
    this._results = value;
  }

  // Extracts tarball asynchronously
  private async _extractTarball(): Promise<Record<string, Buffer>> {
    const files: Record<string, Buffer> = {};
    const extract = tar.extract();

    extract.on("entry", (header, stream, next) => {
      const chunks: Buffer[] = [];

      stream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        if (header.type === "file") {
          files[header.name] = Buffer.concat(chunks);
        }
        next();
      });

      stream.resume();
    });

    extract.on("error", (err) => {
      console.error("Error extracting tarball:", err);
    });

    return new Promise((resolve, reject) => {
      // Use zlib to gunzip the stream before passing it to the tar extractor
      const gunzip = zlib.createGunzip(); // For handling .tar.gz files
      this.stream
        .pipe(gunzip) // Decompress if gzipped
        .pipe(extract)
        .on("finish", () => resolve(files))
        .on("error", reject);
    });
  }

  // Validates JSON files after tarball extraction
  async validateJsonFiles(): Promise<void> {
    const jsonFilesResults: Record<string, string> = {};

    for (const [filename, content] of Object.entries(this.extractedFiles)) {
      if (filename.endsWith(".json")) {
        const isValid = this._isValidJson(content);
        jsonFilesResults[filename] = isValid ? "OK" : "Error";
      }
    }

    const testResult: TestResult = {
      test_type: "JSON Validator",
      status: Object.values(jsonFilesResults).every((status) => status === "OK")
        ? "OK"
        : "Error",
      files: jsonFilesResults,
    };

    this._updateResults(testResult);
  }

  // Updates the results with a new test result
  private _updateResults(newTestResult: TestResult): void {
    if (newTestResult.status === "Error") {
      this._results.status = "Error";
    }
    this._results.tests.push(newTestResult);
  }

  // Checks if a file content is valid JSON
  private _isValidJson(fileContent: Buffer): boolean {
    try {
      JSON.parse(fileContent.toString("utf8"));
      return true;
    } catch {
      return false;
    }
  }
}
