'use strict';
(()=>{
// Conservative compatibility profile, not a claimed universal carrier specification.
const limits=Object.freeze({maxInputBytes:5*1024*1024,maxDimension:480,maxBytes:60*1024});
function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('전송용 사진을 읽지 못했습니다.'));reader.readAsDataURL(blob);});}
async function decode(file){if(typeof createImageBitmap==='function'){try{const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});return {drawable:bitmap,width:bitmap.width,height:bitmap.height,release:()=>bitmap.close()};}catch{}}
return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image(),timer=setTimeout(()=>{URL.revokeObjectURL(url);reject(Error('사진을 여는 데 시간이 초과됐습니다.'));},15000);img.onload=()=>{clearTimeout(timer);URL.revokeObjectURL(url);resolve({drawable:img,width:img.naturalWidth,height:img.naturalHeight,release:()=>{img.src='';}});};img.onerror=()=>{clearTimeout(timer);URL.revokeObjectURL(url);reject(Error('유효한 JPG 사진을 열 수 없습니다.'));};img.src=url;});}
function encode(canvas,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?.size?resolve(blob):reject(Error('사진 JPEG 변환에 실패했습니다.')),'image/jpeg',quality));}
async function prepare(file){if(!file||!/\.jpe?g$/i.test(file.name)||file.type&&file.type!=='image/jpeg'||file.size<4||file.size>limits.maxInputBytes)throw Error('JPG/JPEG 사진 1장(원본 최대 5MB)을 선택하세요.');const decoded=await decode(file);let canvas;
try{const ow=decoded.width,oh=decoded.height;if(!Number.isFinite(ow)||!Number.isFinite(oh)||ow<1||oh<1||ow*oh>60000000)throw Error('사진 해상도를 확인하세요. 최대 6,000만 화소까지 처리합니다.');const scale=Math.min(1,limits.maxDimension/Math.max(ow,oh));let width=Math.max(1,Math.floor(ow*scale)),height=Math.max(1,Math.floor(oh*scale));canvas=document.createElement('canvas');
for(let step=0;step<9;step++){canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('이 브라우저에서 사진 변환을 지원하지 않습니다.');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(decoded.drawable,0,0,width,height);
for(const quality of [.86,.76,.66,.56,.46]){const blob=await encode(canvas,quality);if(blob.size<=limits.maxBytes){const data=await dataURL(blob);if(!data.startsWith('data:image/jpeg;base64,'))throw Error('JPEG 변환 결과를 확인하지 못했습니다.');return {name:file.name.replace(/\.jpe?g$/i,'.jpg'),size:blob.size,data,width,height,originalSize:file.size,originalWidth:ow,originalHeight:oh,prepared:true};}}
width=Math.max(1,Math.floor(width*.82));height=Math.max(1,Math.floor(height*.82));}
throw Error('사진을 MMS 전송용 크기로 줄이지 못했습니다. 다른 사진을 선택하세요.');
}finally{decoded.release();if(canvas){canvas.width=0;canvas.height=0;}}}
window.RenaultCRMPhoto=Object.freeze({prepare,limits});
})();
