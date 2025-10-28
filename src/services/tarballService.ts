import path from "path";
import fs from "fs/promises";
import * as tar from "tar";

/**
 * A service class for handling tarball operations, including writing tarball buffers to a specified folder and extracting their contents.
 *
 * This class provides functionality to manage temporary directories for tarball files and ensures that the contents of a tarball
 * can be extracted to a designated location on the filesystem.
 *
 * @class TarballService
 * @param {string} tmpDirectory - The path to the temporary directory where tarball files will be stored.
 */
export class TarballService {
  tmpDirectory: string;
  constructor(tmpDirectory: string) {
    this.tmpDirectory = tmpDirectory;
  }
  public async writeTarballBufferToFolder(
    tarballbuffer: Buffer,
    folder: string
  ) {
    const tarballPath = path.join(this.tmpDirectory, "tarball.tar.gz");

    await fs.mkdir(folder, { recursive: true });

    await fs.writeFile(tarballPath, tarballbuffer);

    await tar.extract({ file: tarballPath, cwd: folder });
    await fs.unlink(tarballPath);
  }
}
