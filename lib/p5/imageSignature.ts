/** Check container identity before native decoding. This is not a full decoder. */
export function verifyImageSignature(type:string,data:Buffer):void {
  let valid=true;
  if(type==='image/png') valid=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  else if(type==='image/jpeg') valid=data[0]===255 && data[1]===216 && data[2]===255;
  else if(type==='image/webp') valid=data.subarray(0,4).toString()==='RIFF' && data.subarray(8,12).toString()==='WEBP';
  else if(type==='image/gif') valid=/^GIF8[79]a$/.test(data.subarray(0,6).toString());
  else if(type==='image/tiff') {
    valid=data.length>=8 && (
      data.subarray(0,4).equals(Buffer.from([73,73,42,0])) ||
      data.subarray(0,4).equals(Buffer.from([77,77,0,42])) ||
      (data.length>=16 && (data.subarray(0,8).equals(Buffer.from([73,73,43,0,8,0,0,0])) ||
        data.subarray(0,8).equals(Buffer.from([77,77,0,43,0,8,0,0])))));
  } else if(['image/avif','image/heic','image/heif'].includes(type)) {
    // ISO BMFF ftyp must be a bounded complete box, with aligned brand entries.
    const size=data.length>=4?data.readUInt32BE(0):0;
    valid=size>=16 && size<=data.length && size<=4096 && size%4===0 && data.subarray(4,8).toString('ascii')==='ftyp';
    if(valid) {
      const brands=[data.subarray(8,12).toString('ascii')];
      for(let i=16;i<size;i+=4)brands.push(data.subarray(i,i+4).toString('ascii'));
      const allowed=type==='image/avif'?['avif','avis']:['heic','heix','hevc','hevx','mif1','msf1'];
      valid=brands.some(brand=>allowed.includes(brand));
    }
  }
  if(!valid)throw new Error('This photo does not match its file format. Export a fresh JPEG, PNG or original photo file.');
}
