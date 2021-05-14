function showSelectedImage_svg(embs,idx) {
    const margin={top:50,bottom:30,left:20,right:20};
    var frame=embs[idx];

    var width=d3.select(".sideview")
        .style("width")
        .slice(0,-2);
    var height=width;

    var maxWidth=d3.min([width*0.9,800]);
    var maxHeight=d3.min([height*0.6,500]);

    var imgWidth=maxWidth*0.6;
    var patchWidth=100;
    
    var svgImg=d3.select("#Image")
        .attr("width",imgWidth+margin.left)
        .attr("height",imgWidth*0.6+margin.top+margin.bottom);
    

    function FormatNumberLength(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }

    if (frame) {
        var frame_url=image_url+activities[frame.seq_labels]+"/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";
        // var frame_url="/media/felicia/Data/mlb-youtube"+activities[frame.seq_labels]+"_videos/rm_noise/frames/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";
    
        svgImg.select("#theImage")
            .attr("xlink:href",frame_url)
            .attr("x",margin.left)
            .attr("y",0)
            .attr("width", imgWidth)
            // .attr("height", maxHeight)
            .style("visibility","visible")
    
        // svg.select("text.img-info")
        //     .text(`
        //     Action: ${activities[+frame.seq_labels]}
        //     Video: ${frame.names.slice(2,-1)}
        //     Frame: ${frame.steps}/${frame.seq_lens-1} 
        //     `)
    
    }

    // var image_info=svg.append("svg:text")
    //     .attr("class","img-info")
    //     .attr("x",margin.left)
    //     .attr("y",margin.top+maxHeight+margin.bottom)
    //     .style("background-color","white");
    
}









function heatMap(container,embs, order) {

    var {margin,rectsWidth,rectsHeight}=container;

    var plotLeft=margin.left+(margin.left+margin.right+rectsWidth)*order;

    var svg=d3.select("#heatmap"+String(order))
        .style("width",rectsWidth+margin.left+margin.right)
        .style("height",rectsHeight+margin.top+margin.bottom)
    
    //////////////////////////////////////////////////////
    //////////////// Scatter Plot Axis ///////////////////
    //////////////////////////////////////////////////////
    var xLim=d3.extent(embs.map(a=> eval(a.x)*1.05));
    var yLim=d3.extent(embs.map(a=> eval(a.y)*1.05));

    var xScale=d3.scaleLinear()
        .range([0,rectsWidth])
        .domain(xLim)
    var yScale=d3.scaleLinear()
        .range([rectsHeight,0])
        .domain(yLim)

    var axisX=d3.axisBottom(xScale).tickSize(0);
    var axisY=d3.axisLeft(yScale).tickSize(0);

    svg.append("defs")
        .append("marker")
        .attr("id", "arrowhead-right")
        .attr("refX", 5)
        .attr("refY", 5)
        .attr("markerWidth", 5)
        .attr("markerHeight", 10)
        .append("path")
        .attr("d", "M 0 0 L 5 5 L 0 10")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("fill", "none");

    svg.append("defs")
        .append("marker")
        .attr("id", "arrowhead-top")
        .attr("refX", 5)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 5)
        .append("path")
        .attr("d", "M 0 5 L 5 0 L 10 5")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("fill", "none");

    svg.append("g")
        .attr("id","axisX")
        .style("font","12px")
        .style("transform",`translate(${margin.left}px,${margin.top+rectsHeight}px)`)
        .call(axisX)
    svg.select("#axisX path.domain")
        .attr("marker-end","url(#arrowhead-right)");

    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",margin.left+rectsWidth*.5)
        .attr("y",margin.top+rectsHeight+20)
        .attr("fill","#1A1A1A")
        .text("x");  

    svg.append("g")
        .attr("id","axisY")
        .style("font","12px")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`)
        .call(axisY)
    svg.select("#axisY path.domain")
        .attr("marker-end","url(#arrowhead-top)");
    
    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",15)
        .attr("y",margin.top+rectsHeight*0.5)
        .attr("fill","#1A1A1A")
        .text("y"); 
    
    //////////////////////////////////////////////////////
    ///////////////// Plot rectangles ////////////////////
    //////////////////////////////////////////////////////

    var inputForRectBinning = []
    embs.forEach(function(d) {
        if (d.domain==featureDomains[order]) {
            inputForRectBinning.push([+d.x, +d.y]);
        }
    })
    var rects=[null,null,null]


    // Compute the rectbin
    var output = document.getElementById("binsizeOutput");
    function update(binsize) {
        output.innerHTML = binsize;

        var rectbin = d3.rectbin()
            .dx(binsize)
            .dy(binsize);
        var rectbinData=rectbin(inputForRectBinning);

        var heightInPx = yScale(yLim[1]-binsize);
        var widthInPx = xScale(xLim[0]+binsize);

        // Prepare a color palette
        var histogramData=rectbinData.map(a=> eval(a.length));
        var colorLim=d3.extent(histogramData);

        var color = d3.scaleLinear()
            .domain(colorLim) // Number of points in the bin?
            .range(["transparent", "#69a3b2"]);
            
        rects=svg
            .selectAll("rect")
            .data(rectbinData)
            
        rects.enter()
            .append("g")
            .append("rect")
            .merge(rects)
            .transition()
            .duration(1000)
            .attr("x", function(d) { return margin.left+xScale(d.x) })
            .attr("y", function(d) { return margin.top+yScale(d.y) - heightInPx })
            .attr("width", widthInPx)
            .attr("height", heightInPx)
            .attr("fill", function(d) { return color(d.length); })
            // .attr("stroke", "grey")
            // .attr("stroke-width", "0.2");

        rects
            .exit()
            .remove();
        console.log(order);
    }

    update(10);

    d3.select("#binsizeSlider").on("input",function() {
        update(+this.value);
    });
}

function multiHeatMap(embs) {
    var width=d3.select(".longview")
        .style("width")
        .slice(0,-2);
    const margin={top:50,bottom:30,left:30,right:30};

    var maxWidth=width*0.9;
    var maxHeight=d3.min([width*0.5,300]);

    var container={
        margin:margin,
        rectsWidth:maxWidth*0.3,
        rectsHeight:maxHeight
    }
    
    heatMap(container,embs,0);
    heatMap(container,embs,1);
    // heatMap(container,embs,2);

}


//////////////////////////////////////////////////////
//////////////////// Video Events ////////////////////
//////////////////////////////////////////////////////

// function showSelectedVideo(vectors,vidx,row,activity){
//     const events={"swing":["start","kneeFullUp","armStretched","ballRelease","ballSwungBackFully","ballHitsBall","end"]
//     ,"ball":["start","kneeFullUp","wideStanceSquat","armStretched","ballRelease","ballSwungBackFully","ballHitsMitt","end"]};
//     const timestamps={"swing":[
//     {"vidx":153,"video":"Q9C23P705TRU",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":9},{"event":"pitcher","time":14},
//                         {"event":"pitcher","time":22},{"event":"batter","time":28},{"event":"batter","time":35},{"event":"end","time":53}]},
//     {"vidx":173,"video":"RRP522N7EH6H",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":15},
//                         {"event":"pitcher","time":22},{"event":"batter","time":28},{"event":"batter","time":34},{"event":"end","time":52}]},
//     {"vidx":2,"video":'NK2QQPK97TXP',
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":10},{"event":"pitcher","time":23},
//                     {"event":"pitcher","time":27},{"event":"batter","time":36},{"event":"batter","time":41},{"event":"end","time":53}]},
//     {"vidx":36,"video":'LV8BCJF9SN0H',
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":18},
//                         {"event":"pitcher","time":22},{"event":"batter","time":28},{"event":"batter","time":36},{"event":"end","time":52}]},
//     {"vidx":59,"video":"OQGZJBOCMYTQ",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":23},
//                     {"event":"pitcher","time":28},{"event":"batter","time":32},{"event":"batter","time":43},{"event":"end","time":51}]},
//     {"vidx":76,"video":"MQXR94HRXMPX",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":10},{"event":"pitcher","time":28},
//                         {"event":"pitcher","time":34},{"event":"batter","time":41},{"event":"batter","time":46},{"event":"end","time":53}]},
//     {"vidx":49,"video":"6AP01KZ9I26V",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":7},
//                         {"event":"pitcher","time":11},{"event":"batter","time":20},{"event":"batter","time":25},{"event":"end","time":52}]},
//     {"vidx":171,"video":"82JU4CNDZ1QG",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":4},
//                         {"event":"pitcher","time":9},{"event":"batter","time":17},{"event":"batter","time":22},{"event":"end","time":52}]},
//     {"vidx":5,"video":"2I38PMQAZKOE",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":11},
//                         {"event":"pitcher","time":16},{"event":"batter","time":23},{"event":"batter","time":28},{"event":"end","time":53}]},
//     {"vidx":78,"video":"N4DZ1ICCKRV6",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":10},
//                         {"event":"pitcher","time":16},{"event":"batter","time":23},{"event":"batter","time":30},{"event":"end","time":51}]},
//     {"vidx":47,"video":"MCSHM73GYPV8",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":11},
//                         {"event":"pitcher","time":17},{"event":"batter","time":24},{"event":"batter","time":31},{"event":"end","time":51}]},        
//     {"vidx":11,"video":"5RDXSGV62UED",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":7},
//                         {"event":"pitcher","time":13},{"event":"batter","time":21},{"event":"batter","time":25},{"event":"end","time":51}]}, 
//     {"vidx":203,"video":"131B7Z4JO9B5",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":2},{"event":"pitcher","time":16},
//                         {"event":"pitcher","time":20},{"event":"batter","time":24},{"event":"batter","time":33},{"event":"end","time":53}]},
//     {"vidx":17,"video":"OQSC6R1XSMYY",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":16},
//                         {"event":"pitcher","time":20},{"event":"batter","time":27},{"event":"batter","time":33},{"event":"end","time":52}]},
//     {"vidx":112,"video":"4AL3YIWXTZED",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":16},
//                         {"event":"pitcher","time":20},{"event":"batter","time":29},{"event":"batter","time":34},{"event":"end","time":52}]},
//     {"vidx":156,"video":"20FOCYBEKWII",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":17},
//                         {"event":"pitcher","time":22},{"event":"batter","time":30},{"event":"batter","time":36},{"event":"end","time":52}]},
//     {"vidx":165,"video":"H2RJ33BPVBQ4",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":15},
//                         {"event":"pitcher","time":20},{"event":"batter","time":26},{"event":"batter","time":33},{"event":"end","time":52}]},
//     {"vidx":175,"video":"D8VI1WQ5GFI0",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":14},
//                         {"event":"pitcher","time":19},{"event":"batter","time":27},{"event":"batter","time":32},{"event":"end","time":51}]},
//     {"vidx":198,"video":"NM9MYF2F8620",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":16},
//                         {"event":"pitcher","time":21},{"event":"batter","time":28},{"event":"batter","time":33},{"event":"end","time":51}]},                    
//     {"vidx":86,"video":"MN0RZJGOBTJZ",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":15},
//                         {"event":"pitcher","time":20},{"event":"batter","time":27},{"event":"batter","time":34},{"event":"end","time":52}]}, 
//     {"vidx":137,"video":"CI7I88Z16L4C",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":14},
//                         {"event":"pitcher","time":21},{"event":"batter","time":27},{"event":"batter","time":33},{"event":"end","time":53}]}, 
//     {"vidx":118,"video":"0ZZOMDIRKUHT",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":9},
//                         {"event":"pitcher","time":17},{"event":"batter","time":24},{"event":"batter","time":39},{"event":"end","time":52}]},
//     {"vidx":106,"video":"OOMWCSDU09JV",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":10},
//                         {"event":"pitcher","time":14},{"event":"batter","time":20},{"event":"batter","time":26},{"event":"end","time":52}]},
//     {"vidx":14,"video":"CO24TQ52TXCF",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":17},
//                         {"event":"pitcher","time":24},{"event":"batter","time":29},{"event":"batter","time":37},{"event":"end","time":51}]},
//     {"vidx":185,"video":"O35GBDO4IA6O",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":18},
//                         {"event":"pitcher","time":24},{"event":"batter","time":30},{"event":"batter","time":36},{"event":"end","time":51}]},
//     {"vidx":68,"video":"G7VR5IJV0IAX",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":15},
//                         {"event":"pitcher","time":18},{"event":"batter","time":22},{"event":"batter","time":31},{"event":"end","time":53}]},
//     {"vidx":61,"video":'3MZWXKNR08QJ',
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":6},{"event":"pitcher","time":16},
//                         {"event":"pitcher","time":21},{"event":"batter","time":26},{"event":"batter","time":33},{"event":"end","time":53}]},
//     {"vidx":105,"video":"B6ZDY1EVJCSJ",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":12},
//                         {"event":"pitcher","time":16},{"event":"batter","time":24},{"event":"batter","time":31},{"event":"end","time":52}]},
//     {"vidx":81,"video":"N495HRUNVOOZ",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":20},
//                         {"event":"pitcher","time":24},{"event":"batter","time":30},{"event":"batter","time":36},{"event":"end","time":52}]},
//     {"vidx":201,"video":"I9B4I1HQERAT",
//     "events":[{"event":"start","time":0},{"event":"pitcher","time":0},{"event":"pitcher","time":0},
//                         {"event":"pitcher","time":12},{"event":"batter","time":20},{"event":"batter","time":25},{"event":"end","time":52}]}],
//     "ball":[0,14,26,31,35,43,50,83]};
//     const margin={top:30,bottom:30,left:10,right:10};

//     var actionLabel=activities.indexOf(activity)
//     var videoSelected=vectors.filter(i=>
//         i.label==actionLabel && i.vidx==vidx
//     )[0]
//     var width=500;
    
//     var maxWidth=d3.min([width-margin.left-margin.right,500]);
//     // var maxHeight=d3.min([width*0.6,350]);

//     var imgWidth=maxWidth/3;
//     var imgHeight=imgWidth*0.6;

//     function FormatNumberLength(num, length) {
//         var r = "" + num;
//         while (r.length < length) {
//             r = "0" + r;
//         }
//         return r;
//     }

//     for (let i=0;i<events[activity].length;i++){
//         var Img=document.getElementById(`${activity}-image-${row}-${i}`);
//         var event_url=extention_id+activity+"_videos/rm_noise/frames/"+videoSelected.video+FormatNumberLength(timestamps[activity][i],4)+".jpg";

//         Img.width=imgWidth;
//         Img.height=imgHeight;

//         Img.src=event_url;
//     }
// }


// <!-- <div id="swingEvent"
// style= "display: inline-block;width:40%;vertical-align: top;"
// >
//     <h3 style="color: #3B3B3B; float:left; width:50%;margin-top:5px;margin-bottom: 5px;">Video X</h3>
//     <div class="img-container" style="display:inline-block;">
//         <div class="content_img">
//             <img id="swing-image-0-0" style="border: 3px solid #bec8cc;margin: 1px;"><div>Start</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-0-1" style="border: 3px solid #ebe544;margin: 1px;"><div>Knee full up</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-0-2" style="border: 3px solid #ebe544;margin: 1px;"><div>Arm stretched</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-0-3" style="border: 3px solid #ebe544;margin: 1px;"><div>Ball release</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-0-4" style="border: 3px solid #83d1eb;margin: 1px;"><div>Ball swung back fully</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-0-5" style="border: 3px solid #83d1eb;margin: 1px;"><div>Ball hits ball</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-0-6" style="border: 3px solid #bec8cc;margin: 1px;"><div>End</div> 
//         </div>
//     </div>
//     <h3 style="color: #3B3B3B; float:left; width:50%;margin-top:5px;margin-bottom: 5px;">Video Y</h3>
//     <div class="img-container" style="display:inline-block;">
//         <h3 style="display:inline;">Video Y</h3> 
//          <div class="content_img">
//             <img id="swing-image-1-0" style="border: 3px solid #bec8cc;margin: 1px;"><div>Start</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-1-1" style="border: 3px solid #ebe544;margin: 1px;"><div>Knee full up</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-1-2" style="border: 3px solid #ebe544;margin: 1px;"><div>Arm stretched</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-1-3" style="border: 3px solid #ebe544;margin: 1px;"><div>Ball release</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-1-4" style="border: 3px solid #83d1eb;margin: 1px;"><div>Ball swung back fully</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-1-5" style="border: 3px solid #83d1eb;margin: 1px;"><div>Ball hits ball</div> 
//         </div>
//         <div class="content_img">
//             <img id="swing-image-1-6" style="border: 3px solid #bec8cc;margin: 1px;"><div>End</div> 
//         </div>
//     </div>
// </div> -->


// <!-- <div id="eventSwing",
// style="display: inline-block;width:50%;vertical-align: top;">
//     <h1></h1>
//     <img  class="rounded float-left"  >
//     <img class="rounded float-left">
// </div> -->


// function mouseMoveHandler(domain="image") {
//     // get the current mouse position
//     const [mx, my] = d3.mouse(this);
//     const site = voronoiDiagramImg.find(mx, my, voronoiRadius);

//     // highlight the point if we found one
//     highlight(site && site.data);
//     tooltipDisplay(site && site.data);
// }

// function mouseClickHandler(domain="image") {
//     // get the current mouse position
//     event.stopPropagation();

//     const [mx, my] = d3.mouse(this);
//     const site = voronoiDiagramImg.find(mx, my, voronoiRadius);
//     // highlight the point if we found one
//     clicked(site && site.data);
//     showSelectedImage(embs,+(site && site.data).id,true);

// }


// const scatter_path=`data/${action}_${split}_${date}_5000_embs_patch.csv`;
// const scatter_path=`data/${action}_${split}_${date}_embs_flow_48video_patch.csv`;

// const hist_path=`data/bbgame_swing_multiple_${split}_${date}_pca_dtw.csv`;
// const image_url="https:///baseballgameactivities.s3.us-east-2.amazonaws.com/";


// const reference_idx=[[1013,1225,1331],[3495,1383,2396]] # for 52videos
