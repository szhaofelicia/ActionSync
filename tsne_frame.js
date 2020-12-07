let store={
    "selected_frame":null,
}
const action="bbgame_swing_ball";
const split="train";
const date="0815";
// const json_path=`data/${action}_${split}_${date}_5000_embs.csv`;
const json_path=`data/${action}_${split}_${date}_embs_flow_48videos.csv`;
const image_url="https://baseballgameactivities.s3.us-east-2.amazonaws.com/";
const activities=["swing","ball"];
function loadData() {
    return Promise.all([
        d3.csv(json_path)
    ]).then(datasets =>{
        store.embs_dict=datasets[0];
        return store;
    })
}

function embsScatter(embs) {
    var width=d3.select(".mainview")
        .style("width")
        .slice(0,-2);
    var height=width;
    const margin={top:50,bottom:30,left:50,right:50};

    var maxWidth=d3.min([width*0.8,800]);
    var maxHeight=d3.min([height*0.6,500]);

    var svg=d3.select("#scatter")
        .attr("width",maxWidth+margin.left+margin.right)
        .attr("height",maxHeight+margin.top+margin.bottom)

    var body=svg.append("g")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`);

    var dtwAArray=[];
    var dtwBArray=[];
    for (let d=0;d<embs.length;d++) {
        if (+embs[d].seq_labels==0) {
            dtwAArray.push(+embs[d].dtw);
        }else{
            dtwBArray.push(+embs[d].dtw);
        }
    }
    dtwAArray.sort(function(x,y) {
        return d3.ascending(x,y);
    })
    dtwBArray.sort(function(x,y) {
        return d3.ascending(x,y);
    })

    var domainA=[d3.quantile(dtwAArray,0),
        d3.quantile(dtwAArray,0.25),
        d3.quantile(dtwAArray,0.5),
        d3.quantile(dtwAArray,0.75),
        d3.quantile(dtwAArray,1)]
    var domainB=[d3.quantile(dtwBArray,0),
        d3.quantile(dtwBArray,0.25),
        d3.quantile(dtwBArray,0.5),
        d3.quantile(dtwBArray,0.75),
        d3.quantile(dtwBArray,1)]
    
    var domains=[domainA,domainB];

    var colorsA=["#edf8fb","#b2e2e2","#66c2a4","#2ca25f","#006d2c"]; 
    var colorsB=["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"];
    var colors=[colorsA,colorsB];
    
    var colorScaleA=d3.scaleLinear()
        .domain(domainA)
        .range(colorsA);
    var colorScaleB=d3.scaleLinear()
        .domain(domainB)
        .range(colorsB);
    
    var colorOrd=d3.scaleOrdinal()
        .range(["#006d2c","#7a0177"])
        .domain(["Swing","Ball"]);

    var xScale=d3.scaleLinear()
        .range([0,maxWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsne)[0]*1.1)))
    var yScale=d3.scaleLinear()
        .range([maxHeight,0])
        .domain(d3.extent(embs.map(a=> eval(a.tsne)[1]*1.1)))
    
    const pointSize=50; //200:75
    const pointOpacity=.7; //200:0.5

    //////////////////////////////////////////////////////
    /////////////////// Scatter Plot /////////////////////
    //////////////////////////////////////////////////////
    var points=body.append("g")
        .attr("class","pointsWrapper");
    points.selectAll("point")
        .data(embs).enter()
        .append("path")
        .attr("class","point")
        .attr("d",d3.symbol().size(pointSize).type(function(d) {
            if(+d.seq_labels==0) {
                return d3.symbolCircle;
            }else{
                return d3.symbolTriangle;
            }
        }))
        .attr("transform",function(d) {
            return `translate(${xScale(eval(d.tsne)[0])},${yScale(eval(d.tsne)[1])})`;
        })
        .attr("fill-opacity",pointOpacity)
        .attr("fill",function(d) {
            if(+d.seq_labels==0) {
                return colorScaleA(d.dtw)
            }else{
                return colorScaleB(d.dtw)
            }
        })
        .attr("id",function(d) {
            return d.id.toString();})
        .attr("visibility","visible")
            
    // Add axis
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
        .style("transform",`translate(${margin.left}px,${margin.top+maxHeight}px)`)
        .call(axisX)
    svg.select("#axisX path.domain")
        .attr("marker-end","url(#arrowhead-right)");

    svg.append("g")
        .attr("id","axisY")
        .style("font","12px")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`)
        .call(axisY)
    svg.select("#axisY path.domain")
        .attr("marker-end","url(#arrowhead-top)");

        
    //////////////////////////////////////////////////////
    /////////////////// Opacity Slider ////////////////////
    //////////////////////////////////////////////////////

    // slider = html`<input type=range>`
    
    //////////////////////////////////////////////////////
    /////////////////// Action Legend ////////////////////
    //////////////////////////////////////////////////////
    // Legend SVG
    var legendWidth=d3.select(".legendview")
        .style("width")
        .slice(0,-2);
    var svgLegend=d3.select("#actionLegend")
        .attr("width",legendWidth)
        .attr("height",maxHeight+margin.top+margin.bottom)
    var legendWrapper=svgLegend.append("g").attr("class", "legendWrapper")
        .style("transform",`translate(${margin.left}px,${margin.top*.5}px)`);

    const marker_h=25;
    const lg_w=20;
    const lg_h=150;
    
    ///////////////////////////////////////////////////////////////////////////
    ////////////////// Hover & Click functions for legend /////////////////////
    ///////////////////////////////////////////////////////////////////////////

    //Decrease opacity of non selected circles when hovering in the legend	
    function selectLegend(opacity) {
        return function(d, i) {
            var chosen =i;
                
            body.selectAll(".point")
                .filter(function(d) { return d.seq_labels != chosen; })
                .transition()
                .style("opacity", opacity);
        };
    }//function selectLegend

    //Function to show only the circles for the clicked sector in the legend
    function clickLegend(d,i) {
        
        event.stopPropagation();

        //deactivate the mouse over and mouse out events
        d3.selectAll(".legendMarker")
            .on("mouseover", null)
            .on("mouseout", null);
            
        //Chosen legend item
        var chosen = i;
                
        //Only show the circles of the chosen sector
        body.selectAll(".point")
            .style("opacity", pointOpacity)
            .style("visibility", function(d) {
                if (d.seq_labels != chosen) return "hidden";
                else return "visible";
            });
                
    }//sectorClick

    var actionLegend=legendWrapper.selectAll(".legendMarker")  	
        .data(colorOrd.range())                              
        .enter().append("g")   
        .attr("class", "legendMarker") 
        .attr("transform", function(d,i) { return "translate(" + 10 + "," + (70+i * marker_h) + ")"; })
        .style("cursor", "pointer")
        .on("mouseover", selectLegend(0.02))
        .on("mouseout", selectLegend(pointOpacity))
        .on("click", clickLegend);
    
    actionLegend.append("path")
        .attr("id","marker"+i)
        .attr("d",d3.symbol().size("150").type(function(d,i) {
            if (i==0) {
                return d3.symbolCircle;
            }else {
                return d3.symbolTriangle;
            }
        }))
        .attr("width",lg_w)
        .attr("height",marker_h)
        .attr("fill", function(d) {return d;})
        .attr("fill-opacity",pointOpacity);

    actionLegend.append("text")
        .style("font-size","12px")
        .style("text-anchor","start")
        .attr("transform", function(d,i) { return `translate(${30},${5})`;})
        .attr("fill","#1A1A1A")
        .text(function (d,i) { return colorOrd.domain()[i]; }); 
    
    legendWrapper.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("transform",`translate(${0},${50})`) 
        .attr("fill","#1A1A1A")
        .text("Activities");   

        
    //////////////////////////////////////////////////////
    ///////////////////// Colorbars //////////////////////
    //////////////////////////////////////////////////////

    var lg_x;
    var lg_y;
    var defs=svg.append("defs");
    var linearGradient;

    for(var i=0;i<2;i++) {
        lg_x=i*lg_w*2.5;
        lg_y=100+lg_h*.5;

        linearGradient=defs.append("linearGradient")
            .attr("id","linear-gradient-"+i);
        linearGradient
            .attr("x1","100%")
            .attr("y1","100%")
            .attr("x2","100%")
            .attr("y2","0%");
        linearGradient.selectAll("stop")
            .data([
                {offset:"0%",color:colors[i][0]},
                {offset:"25%",color:colors[i][1]},
                {offset:"50%",color:colors[i][2]},
                {offset:"75%",color:colors[i][3]},
                {offset:"100%",color:colors[i][4]},
            ]).enter()
            .append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

        legendWrapper
            .append("rect")
            .attr("x",lg_x)
            .attr("y",lg_y)
            .attr("width",lg_w)
            .attr("height",lg_h)
            .attr("fill","url(#linear-gradient-"+i+")")
            .style("opacity",0.7);
        
        let colorBarDomain=domains[i].map(d=>d.toFixed(0));
        let colorBardRange=[lg_h,lg_h*0.75,lg_h*0.5,lg_h*0.25,0];
        
        legendWrapper.append("g")
            .attr("transform",`translate(${lg_x+lg_w},${lg_y})`)
            .call(d3.axisRight(d3.scaleOrdinal().domain(colorBarDomain).range(colorBardRange)));
    }

    legendWrapper.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("transform",`translate(${0},${lg_y-10})`) 
        .attr("fill","#1A1A1A")
        .text("DTW Order");   

    //////////////////////////////////////////////////////
    ///////////////// Scatter selection //////////////////
    //////////////////////////////////////////////////////
    const voronoiRadius=maxWidth/30;

    var voronoiDiagram=d3.voronoi(embs)
        .x(d => xScale(eval(d.tsne)[0]))
        .y(d => yScale(eval(d.tsne)[1]))
        .size([maxWidth,maxHeight])(embs);

    // var voronoiGroup=body.append("g")
    //     .attr("class", "voronoiWrapper");
    
    body.append("path")
        .attr("class","highlight-point")
        .style("display","none")
        .style("fill", "none")
    
    body.append("path")
        .attr("class","selected-point")
        .style("display","none")
        .style("fill", "none")
    
    var tooltip=d3.select("#tsne")
        .append("g")
        .append("div")
        .attr("class","tooltip")
        .style("opacity",0)
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px");

    function highlight (d) {
        if (!d) {
            d3.select(".highlight-point").style("display","none");
        }else {
            d3.select(".highlight-point")
                .style("display","")
                .attr("d",d3.symbol().size(pointSize).type(function() {
                    if(+d.seq_labels==0) {
                        return d3.symbolCircle;
                    }else{
                        return d3.symbolTriangle;
                    }}))
                .attr("transform",function() {
                    return `translate(${xScale(eval(d.tsne)[0])},${yScale(eval(d.tsne)[1])})`;})
                .style("stroke", "gray")
                .style("stroke-dasharray", ("3, 2"))
                .style("stroke-width", "1px")
                .style("stroke-opacity", 1);
        }
    }

    function clicked (d) {
        if (d) {
            d3.select(".selected-point")
                .style("display","")
                .attr("d",d3.symbol().size(pointSize).type(function() {
                    if(+d.seq_labels==0) {
                        return d3.symbolCircle;
                    }else{
                        return d3.symbolTriangle;
                    }}))
                .attr("transform",function() {
                    return `translate(${xScale(eval(d.tsne)[0])},${yScale(eval(d.tsne)[1])})`;})
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("stroke-opacity", 1);
            
        }
    }
    
    function tooltipDisplay(d) {
        if (!d) {
            tooltip.style("opacity", 0);
        }else {
            tooltip
                .html(`
                    Action: ${activities[+d.seq_labels]} </br>
                    Video: ${d.names.slice(2,-1)} </br>
                    Frame: ${d.steps}/${d.seq_lens-1} </br>
                    DTW label: ${d.dtw} </br>
                    Optical flow: ${(+d.flow).toFixed(2)} 
                    `)
                .style("opacity", 0.7)
                .style("left",xScale(eval(d.tsne)[0])+margin.left+20+"px")
                .style("top",margin.top+yScale(eval(d.tsne)[1])-20+"px");
        }
    }

    function mouseMoveHandler() {
        // get the current mouse position
        const [mx, my] = d3.mouse(this);
        const site = voronoiDiagram.find(mx, my, voronoiRadius);

        // highlight the point if we found one
        highlight(site && site.data);
        tooltipDisplay(site && site.data);
    }

    function mouseClickHandler() {
        // get the current mouse position
        event.stopPropagation();

        const [mx, my] = d3.mouse(this);
        const site = voronoiDiagram.find(mx, my, voronoiRadius);

        // highlight the point if we found one
        clicked(site && site.data);
        showSelectedImage(embs,+(site && site.data).id,true);

    }

    function mouseMoveOut() {
        highlight(null);
    }

    function resetClick() {
        d3.selectAll(".selected-point").style("display","none");

        d3.selectAll(".legendMarker")
            .on("mouseover", selectLegend(0.02))
            .on("mouseout", selectLegend(pointOpacity));

        body.selectAll(".point")
            .style("opacity", pointOpacity)
            .style("visibility", "visible");
        
        var img = document.getElementById("theImage");
        if (img) {
            img.style.visibility="hidden";
            console.log(img);
        }

    }

    body.append("rect")
        .attr("class", "overlay")
        .attr("width", maxWidth)
        .attr("height", maxHeight)
        .style("fill", "#f00")
        .style("fill-opacity", 0)
        .on("mousemove", mouseMoveHandler)
        .on("mouseleave", mouseMoveOut)            
        .on("click",mouseClickHandler);

    // d3.select("#Scatter").on("click", resetClick);
    d3.select("#ActionLegend").on("click", resetClick);


    // Lasso functions
    var lasso_start = function() {
        lasso.items()
            .classed("not_possible",true)
            .classed("selected",false);
    };

    var lasso_draw = function() {
    
        // Style the possible dots
        lasso.possibleItems()
            .classed("not_possible",false)
            .classed("possible",true);

        // Style the not possible dot
        lasso.notPossibleItems()
            .classed("not_possible",true)
            .classed("possible",false);

    };

    var lasso_end = function() {
        // Reset the color of all dots

        lasso.items()
            .classed("not_possible",false)
            .classed("possible",false);

        // Style the selected dots
        lasso.selectedItems()
            .classed("selected",true)
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("stroke-opacity", 1);

        // Reset the style of the not selected dots
        lasso.notSelectedItems()
            .style("stroke", "none");

        resetClick(); // deactivate selected point by click

        var centerIdx=CenterPointer(embs,lasso.selectedItems()._groups[0])
        showSelectedImage(embs,centerIdx,true);

    };
    
    var lasso = d3.lasso()
        .closePathSelect(true)
        .closePathDistance(100)
        .items(d3.selectAll(".point"))
        .targetArea(d3.select("#Scatter"))
        .on("start",lasso_start)
        .on("draw",lasso_draw)
        .on("end",lasso_end);
    
    svg.call(lasso);
}

function CenterPointer(embs,points) {
    var idxs=points.map(a=>+a.id);
    var tsnes=[];
    var total=[0,0];
    var average=[0,0];
    var dist=[];
    for (let i=0;i<idxs.length;i++) {
        tsnes.push(eval(embs[idxs[i]].tsne));
        total[0]+=eval(embs[idxs[i]].tsne)[0];
        total[1]+=eval(embs[idxs[i]].tsne)[1];
    }
    average[0]=total[0]/idxs.length;
    average[1]=total[1]/idxs.length;
    for (let i=0;i<idxs.length;i++) {
        let norm_dist=Math.pow(tsnes[i][0]-average[0],2)+Math.pow(tsnes[i][1]-average[1],2);
        dist.push(norm_dist);
    }

    return idxs[dist.indexOf(Math.min(...dist))];
}

function showSelectedImage(embs,idx,visible) {
    const margin={top:50,bottom:30,left:50,right:50};
    var frame=embs[idx];

    var width=d3.select(".sideview")
        .style("width")
        .slice(0,-2);
    var height=width;

    var maxWidth=d3.min([width*0.8,800]);
    var maxHeight=d3.min([height*0.6,500]);
    
    var svg=d3.select("#Image")
        .attr("width",maxWidth+margin.left+margin.right)
        .attr("height",maxHeight+margin.top+margin.bottom);

    function FormatNumberLength(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }
    var frame_url=image_url+activities[frame.seq_labels]+"/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";
    // var frame_url="/media/felicia/Data/mlb-youtube"+activities[frame.seq_labels]+"_videos/rm_noise/frames/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";

    svg.select("#TheImage")
        .attr("xlink:href",frame_url)
        .attr("x",margin.left)
        .attr("y",0)
        .attr("width", maxWidth)
        .attr("height", maxHeight)
        .style("visibility","visible")

    // var image_info=svg.append("svg:text")
    //     .attr("class","img-info")
    //     .attr("x",margin.left)
    //     .attr("y",margin.top+maxHeight+margin.bottom)
    //     .style("background-color","white");
    

    svg.select("text.img-info")
        .text(`
        Action: ${activities[+frame.seq_labels]}
        Video: ${frame.names.slice(2,-1)}
        Frame: ${frame.steps}/${frame.seq_lens-1} 
        `)


}

function showData() {
    let embs=store.embs_dict;

    embsScatter(embs);
}
loadData().then(showData);
