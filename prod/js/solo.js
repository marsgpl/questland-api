var e=/[^0-9a-z_]/gi,t=function(){$("#introduce").addClass("hidden"),$("#events").removeClass("inactive"),$("#toggle").show()},a=function(e){!e&&o.cursor>-1&&(e=o.match[o.cursor]),!e&&o.first&&(e=o.first),e&&(window.location.href+="?uid="+e)},n=function(e){var t=$("#nickname").val();$("#nicknamebg").val(t+e.substr(t.length)).show()},o=function(e=[]){if(o.first=null,o.match=e,o.cursor=-1,o.match.length){$("#suggest").show().empty(),$("#submit").show();for(var t=0;t<o.match.length;++t){var a=o.match[t],i=o.membersOriginal[a];$("#suggest").append('<div class="name" data-uid="'+a+'">'+i+"</div>"),o.first||(o.first=a),(t==o.cursor||o.cursor<0&&o.first==a)&&n(i)}}else $("#suggest").hide().empty(),$("#submit").hide(),$("#nicknamebg").hide()},i=function(){for(var e=$("#suggest").find(".name"),t=0;t<e.length;++t)t===o.cursor?($(e[t]).addClass("cur"),n(o.membersOriginal[o.match[t]])):$(e[t]).removeClass("cur")},r=function(){var t=$("#nickname").val().replace(e,"");if(t!=$("#nickname").val()&&$("#nickname").val(t),(t=t.toLowerCase())!==r.value){r.value=t;var a=[];if(t.length>0)for(var n in o.members)if(t===o.members[n].substr(0,t.length)&&(a.push(n),a.length>5))break;o(a)}};$(function(){var n=document.getElementById("events").getContext("2d");n.canvas.width=window.innerWidth,n.canvas.height=window.innerHeight;var s=function(e){e=(e||window.location.search).replace(/^\?+/,"").split("&");for(var t,a={},n=0;n<e.length;++n)a[(t=e[n].split("=")).shift()]=t.join("=");return a}().uid,l=Date.now(),c=(new Date).getTimezoneOffset();$.get("/reforge/api/event?ms="+l+"&tz="+c,function(l){for(var c in o.members={},o.membersOriginal=l.members,l.members)o.members[c]=l.members[c].replace(e,"").toLowerCase();s||($("#introduce").on("click",function(e){$(e.target).hasClass("shadow")&&t()}),$("#introduce .body .close").on("click",t),$("#submit").on("click",function(){a()}),$(window).on("keydown",function(e){27==(e.keyCode||e.which)&&t()}),$("#nickname").on("keydown",function(e){var t=e.keyCode||e.which;if(13==t)a();else if(38==t){if(o.match.length<1)return;o.cursor--,o.cursor<0&&(o.cursor=o.match.length-1),i()}else if(40==t){if(o.match.length<1)return;o.cursor++,o.cursor>=o.match.length&&(o.cursor=0),i()}}),$("#nickname").on("keypress keyup change focus blur input cut copy paste propertychange",function(e){13!=(e.keyCode||e.which)&&r()}),$("#suggest").on("click",function(e){var t=$(e.target);t.hasClass("name")&&a(t.data("uid"))}),$("#introduce").removeClass("hidden"),$("#events").addClass("inactive"),$("#toggle").hide(),$("#nickname").focus());var d,u=["#A8201A","#EC9A29","#0F8B8D","#143642","#266F34","#9D1DB2","#EC1562","#C0B298","#A4778B","#AA4586","#FCB07E","#3581B8","#44AF69","#F8333C","#FCAB10","#2B9EB3","#3E78B2","#004BA8","#4A525A","#24272B"],h=[];for(d=0;d<l.labels.length;++d)h.push(new Date(1e3*l.labels[d]));var m,f,g,v,p=[],b=0,w=!!s;for(d=0;d<l.datasets.length;++d){c=l.datasets[d].userId;var k=s==c;for(v in w?k?(m="#FF852D",d):m="#B1B1B1":(m=u[b],++b>=u.length&&(b=0)),g=[],(f=l.datasets[d]).data)g.push({x:new Date(1e3*v),y:f.data[v]});p.push({label:f.label+(k?"  Rank #"+(d+1):""),fill:!1,borderColor:m,backgroundColor:m,pointBorderColor:m,pointBackgroundColor:m,pointRadius:0,pointHitRadius:10,pointHoverRadius:3,borderWeight:0,data:g,cubicInterpolationMode:"monotone",borderWidth:k?3:1})}var y={type:"line",options:{responsive:!0,title:{display:!0,text:"Personal event score"},animation:{duration:0},hover:{animationDuration:0},responsiveAnimationDuration:0,layout:{padding:{left:5,right:5,top:5,bottom:5}},scales:{xAxes:[{scaleLabel:{display:!0,labelString:"Date"},type:"time",time:{unit:"day",tooltipFormat:"DD MMMM  HH:mm"}}],yAxes:[{scaleLabel:{display:!0,labelString:"Trophies (skulls)"},ticks:{min:0,max:1.2*l.yMax||1e3,callback:function(e,t,a){return n=e,(n=parseInt(n,10)||0)<1e3?n:n<1e6?Math.floor(n/100)/10+"k":Math.floor(n/1e5)/10+"M";var n}}}]},tooltips:{mode:"nearest",callbacks:{label:function(e,t){for(var a=t.datasets[e.datasetIndex].label.split("  ")[0]+": "+(e.yLabel+"").replace(/\B(?=(\d{3})+(?!\d))/g,","),n=0,o=[],i=0;i<t.datasets.length;++i)o.push({v:t.datasets[i].data[e.index]&&t.datasets[i].data[e.index].y||0,di:i});o.sort(function(e,t){return e.v>t.v?-1:e.v<t.v?1:0});for(var r=0;r<o.length;++r)if(o[r].di==e.datasetIndex){n=0==o[r].v?"N/A":"#"+(r+1);break}return[a,"Rank "+n]}}}},data:{labels:h,datasets:p}},C=new Chart(n,y);$("#toggle").click(function(){C.data.datasets.forEach(function(e){e.hidden=!e.hidden}),C.update()}),$("#loader").remove()});var d=61*(60-(new Date).getMinutes())*1e3;window.console&&console.log("Reload in "+d/1e3/60+"m"),setTimeout(function(){window.location.reload()},d)});