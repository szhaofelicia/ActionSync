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
