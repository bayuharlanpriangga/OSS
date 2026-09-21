// Build & download a single output as .doc
function _exportSingleOutput(id, mode){
  var o=outputs.find(function(x){return x.id===id;});
  if(!o){showToast('Output not found','error');return;}

  var html='';
  html+='<h1>OSS Analysis Report</h1>';
  html+='<p class="meta">Generated: '+new Date().toLocaleString()+'&nbsp;&nbsp;|&nbsp;&nbsp;N = '+data.length+' cases&nbsp;&nbsp;|&nbsp;&nbsp;Variables: '+vars.length+'</p>';
  html+='<hr style="border:none;border-top:1px solid #d4d4d4;margin:10pt 0"/>';
  html+=_buildSingleOutputHTML(o, mode);

  var preHtml="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><title>OSS Report</title><style>"+_wordCSS()+"</style></head><body>";
  var postHtml="</body></html>";
  var fullHtml=preHtml+html+postHtml;
  var blob=new Blob([fullHtml],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  var safeName=o.title.replace(/[^a-zA-Z0-9_]/g,'_').slice(0,40);
  a.download='OSS_'+safeName+'_'+new Date().toISOString().slice(0,10)+'.doc';
  a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
  showToast('Export berhasil');
}
