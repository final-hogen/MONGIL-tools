
/**
 * JSONデータのキーをまとめてデータ圧縮
 */
class JsonCompresser{
  /**
   * zip圧縮64
   * @param {object} data Jsonでーた
   * @returns base64String
   */
  static async gzip(data){
    const jsoonstring = JSON.stringify(data);
    const srcbin = new TextEncoder().encode(jsoonstring);
    const binArray = await new Response(new Blob([srcbin]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    const bin = new Uint8Array(binArray);
    return bin.toBase64();
  }
  /**
   * zip解凍64
   * @param {string} compressed base64String
   * @returns Jsonでーた
   */
  static async unzip(compressed){
    const compressbin = Uint8Array.fromBase64(compressed);
    const binArray = await new Response(new Blob([compressbin]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    const bin = new Uint8Array(binArray);
    const jsonstriing = new TextDecoder('utf-8').decode(bin);
    const data = JSON.parse (jsonstriing);
  return data;
  }
}
