import fs from "fs";
import path from "path";
import { TarballService } from "../src/services/tarballService";
import assert from "assert";
const tmpFolder = path.join(__dirname, "test-files");
const outputFolder = path.join(tmpFolder, "output");
const tarballPath = path.join(tmpFolder, "testtar.tar.gz");
afterEach(() => {
  if (fs.existsSync(outputFolder)) {
    fs.rmSync(outputFolder, { recursive: true });
  }
});
describe("TarballService", () => {
  it("should be able to extract into folder", async () => {
    const service = new TarballService(tmpFolder);
    const tarball = fs.readFileSync(path.join(tarballPath));
    await service.writeTarballBufferToFolder(tarball, outputFolder);
    const files = fs.readdirSync(outputFolder);
    assert.equal(
      files.length,
      1,
      `Wrong number of files, the following files existed: ${files}`
    );
  });
});
