var e=function(e){return(e=parseInt(e,10)||0)<1e3?e:e<1e6?Math.floor(e/100)/10+"k":Math.floor(e/1e5)/10+"M"};$(function(){var t=document.getElementById("events").getContext("2d");t.canvas.width=window.innerWidth,t.canvas.height=window.innerHeight;var o=Date.now(),a=(new Date).getTimezoneOffset();$.get("/reforge/api/eventTeams?ms="+o+"&tz="+a,function(o){var a,n=[];for(a=0;a<o.labels.length;++a)n.push(new Date(1e3*o.labels[a]));var r,s,i,l=[];for(a=0;a<o.datasets.length;++a){for(i in s=[],(r=o.datasets[a]).data)s.push({x:new Date(1e3*i),y:r.data[i]});l.push({label:r.label,fill:!1,borderColor:r.color,backgroundColor:r.color,pointBorderColor:r.color,pointBackgroundColor:r.color,pointRadius:1,pointHitRadius:10,pointHoverRadius:3,borderWeight:0,data:s,cubicInterpolationMode:"monotone",borderWidth:3,meta:{personal:r.personal,persons:r.persons}})}var d={type:"line",options:{responsive:!0,title:{display:!0,text:"Teams event score"},animation:{duration:0},hover:{animationDuration:0},responsiveAnimationDuration:0,layout:{padding:{left:5,right:5,top:5,bottom:5}},scales:{xAxes:[{scaleLabel:{display:!0,labelString:"Date"},type:"time",time:{unit:"day",tooltipFormat:"DD MMMM  HH:mm"}}],yAxes:[{scaleLabel:{display:!0,labelString:"Trophies (skulls)"},ticks:{min:0,max:1.2*o.yMax-1.2*o.yMax%5e5||1e3,callback:function(t,o,a){return e(t)}}}]},tooltips:{mode:"nearest",callbacks:{label:function(t,o){var a,n=o.datasets[t.datasetIndex],r=[n.label.split("  ")[0]+": "+(a=t.yLabel,(a+"").replace(/\B(?=(\d{3})+(?!\d))/g,",")),""],s=n.data[t.index].x,i=Math.round(s.getTime()/1e3),l=[];for(var d in n.meta.personal)l.push({name:d,score:parseInt(n.meta.personal[d][i],10)||0});l.sort(function(e,t){return e.score>t.score?-1:e.score<t.score?1:0});for(var p=0;p<l.length;++p)r.push(l[p].name+": "+e(l[p].score));return r.push(""),r.push(n.meta.persons+" members"),r}}}},data:{labels:n,datasets:l}};new Chart(t,d);$("#loader").remove()});var n=61*(60-(new Date).getMinutes())*1e3;window.console&&console.log("Reload in "+n/1e3/60+"m"),setTimeout(function(){window.location.reload()},n)});