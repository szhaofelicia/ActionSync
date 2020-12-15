let store={
    "selected_frame":null,
}
const action="bbgame_swing_ball";
const split="train";
const date="0815";
// const json_path=`data/${action}_${split}_${date}_5000_embs.csv`;
const scatter_path=`data/${action}_${split}_${date}_embs_flow_48video_patch.csv`;
const hist_path=`data/bbgame_swing_multiple_${split}_${date}_pca_dtw.csv`;
const image_url="https://baseballgameactivities.s3.us-east-2.amazonaws.com/";
const activities=["swing","ball"];
const featureDomains=["image","left","right"];
function loadData() {
    return Promise.all([
        d3.csv(scatter_path),
        d3.csv(hist_path)
    ]).then(datasets =>{
        store.scatter_dict=datasets[0];
        store.swing_dict=datasets[1];
        return store;
    })
}

function embsScatter(embs) {
    var width=d3.select(".leftview")
        .style("width")
        .slice(0,-2);
    // var height=width;
    const margin={top:50,bottom:30,left:50,right:50};


    var maxWidth=d3.min([width*0.8,800]);
    var maxHeight=d3.min([width*0.5,400]);

    var svg=d3.select("#scatter")
        .style("width",maxWidth+margin.left+margin.right)
        .style("height",maxHeight+margin.top+margin.bottom)

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
    //////////////////////////////////////////////////////
    /////////////////// Opacity Slider ///////////////////
    //////////////////////////////////////////////////////

    // const pointOpacity=1;
    var slider=document.getElementById("opacitySlider");
    var output = document.getElementById("opacityOutput");
    let pointOpacity;
    // let update= ()=> pointOpacity=slider.value/100;
    let update = () => {
        output.innerHTML = slider.value+"%";
        pointOpacity=slider.value/100;
    }
    slider.addEventListener("input",update);
    update();

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
            
    //////////////////////////////////////////////////////
    //////////////// Scatter Plot Axis ///////////////////
    //////////////////////////////////////////////////////
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

    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",(margin.left+maxWidth)*.5)
        .attr("y",margin.top+maxHeight+30)
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
        .attr("y",(margin.top+maxHeight)*0.5)
        .attr("fill","#1A1A1A")
        .text("y");  
    

    //////////////////////////////////////////////////////
    /////////////////// Action Legend ////////////////////
    //////////////////////////////////////////////////////
    // Legend SVG
    var legendWidth=d3.select(".legendview")
        .style("width")
        .slice(0,-2);
    var svgLegend=d3.select("#actionLegend")
        .style("width",legendWidth)
        .style("height",maxHeight+margin.top+margin.bottom)
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
        .attr("fill-opacity",1);

    actionLegend.append("text")
        .style("font-size","12px")
        .style("text-anchor","start")
        .attr("transform",`translate(${30},${5})`)
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
    var defs=svgLegend.append("defs");
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
        }
        var myCanvas=document.getElementById("theCanvas")
        var ctx=myCanvas.getContext("2d");
        ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

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

function showSelectedImage(embs,idx) {
    const margin={top:50,bottom:30,left:20,right:20};
    var frame=embs[idx];

    var width=d3.select(".rightview")
        .style("width")
        .slice(0,-2);
    // var height=width;

    var maxWidth=d3.min([width-margin.left-margin.right,800]);
    var maxHeight=d3.min([width*0.6,400]);

    var imgWidth=maxWidth*0.65;
    var imgHeight=maxHeight*0.6+5;

    var patchWidth=maxWidth*0.25;
    var patchHeight=maxHeight*0.3;

    var myImg=document.getElementById("theImage");
    myImg.width=imgWidth;
    myImg.height=imgHeight;
    myImg.style.top=margin.top+"px";
    myImg.style.left=margin.left+"px";
    // myImg.style.border="2px solid #021a40";

    var myCanvas=document.getElementById("theCanvas");
    myCanvas.width=patchWidth;
    myCanvas.height=patchHeight*2+5;
    myCanvas.style.top=margin.top+"px";
    myCanvas.style.left=margin.left+imgWidth+"px";

    var ctx=myCanvas.getContext("2d");

    function FormatNumberLength(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }

    if (frame) {
        var frame_url=image_url+activities[frame.seq_labels]+"/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";
        myImg.src=frame_url;
        myImg.style.visibility="visible";
        var posi={ll:eval(frame.left)[0],lt:eval(frame.left)[1],rl:eval(frame.right)[0],rt:eval(frame.right)[1]}
         
        myImg.onload= function() {
            ctx.drawImage(myImg,posi.ll,posi.lt,500,450,0,0,patchWidth,patchHeight);
            ctx.drawImage(myImg,posi.rl,posi.rt,500,450,0,patchHeight+5,patchWidth,patchHeight);
        }
    }
}


function heatMap(container,embs, order) {

    var {margin,rectsWidth,rectsHeight}=container;

    // var plotLeft=margin.left+(margin.left+margin.right+rectsWidth)*order;

    var svg=d3.select("#heatmap"+String(order))
        .style("width",rectsWidth+margin.left+margin.right)
        .style("height",rectsHeight+margin.top+margin.bottom)
    
    //////////////////////////////////////////////////////
    //////////////// Scatter Plot Axis ///////////////////
    //////////////////////////////////////////////////////
    var xLim=d3.extent(embs.map(function(d,i) {
        if (d.domain==featureDomains[order]) {
            return eval(d.x)*1.0;
        }
    }))

    var yLim=d3.extent(embs.map(function(d,i) {
        if (d.domain==featureDomains[order]) {
            return eval(d.y)*1.0;
        }
    }))

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
        .attr("x",0)
        .attr("y",margin.top+rectsHeight*0.5)
        .attr("fill","#1A1A1A")
        .text("y"); 
    
    var title=featureDomains[order]
    
    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",margin.left+rectsWidth*0.5)
        .attr("y",20)
        .attr("fill","#1A1A1A")
        .text(title); 
    
    //////////////////////////////////////////////////////
    ///////////////// Plot rectangles ////////////////////
    //////////////////////////////////////////////////////

    var inputForRectBinning = []
    embs.forEach(function(d) {
        if (d.domain==featureDomains[order]) {
            inputForRectBinning.push([+d.x, +d.y]);
        }
    })

    const lg_w=20;
    const lg_h=150;

    // Compute the rectbin
    var output = document.getElementById("binsizeOutput"+String(order));
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

        var colorDensity = d3.scaleSequential(d3.interpolateBuPu)
            .domain(colorLim) // Number of points in the bin?
            // .range(["transparent", "#69a3b2"]);
            // .range(["#FFFFDD","#1F2D86"]);
        // var colorAttr=d3.interpolatePlasma();
            
        var rects=svg
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
            .attr("fill", function(d) { return colorDensity(d.length); })
            .attr("stroke", "#A8A8A8")
            .attr("stroke-width", "0.1");

        rects
            .exit()
            .remove();
    }

    update(1);

    d3.select("#binsizeSlider"+String(order)).on("input",function() {
        update(+this.value/10);
    });
}

function multiHeatMap(embs) {
    var width=d3.select(".longview")
        .style("width")
        .slice(0,-2);
    const margin={top:70,bottom:30,left:20,right:100};

    var maxWidth=width*0.9;
    var maxHeight=d3.min([width*0.5,300]);

    var container={
        margin:margin,
        rectsWidth:maxWidth*0.25,
        rectsHeight:maxHeight
    }
    
    heatMap(container,embs,0);
    heatMap(container,embs,1);
    heatMap(container,embs,2);

    //////////////////////////////////////////////////////
    /////////////////// Action Legend ////////////////////
    //////////////////////////////////////////////////////
    // var color = d3.scaleSequential(d3.interpolateBuPu)
    //     .domain([0,100]) // Number of points in the bin?

    // var legendWidth=d3.select(".legendview")
    //     .style("width")
    //     .slice(0,-2);
    // var svgLegend=d3.select("#histLegend")
    //     .style("width",legendWidth)
    //     .style("height",maxHeight+margin.top+margin.bottom)

    // var defs=svgLegend.append("defs");

    // var legendWrapper=svgLegend.append("g").attr("class", "legendWrapper")
    //     .style("transform",`translate(${margin.left}px,${margin.top*.5}px)`);
    
    // var linearGradient=defs.append("linearGradient")
    //     .attr("id","linear-gradient");
    // linearGradient
    //     .attr("x1","100%")
    //     .attr("y1","100%")
    //     .attr("x2","100%")
    //     .attr("y2","0%");
    // linearGradient.selectAll("stop")
    //     .data([
    //         {offset:"0%",color:color(0)},
    //         {offset:"100%",color:color(100)},
    //     ]).enter()
    //     .append("stop")
    //     .attr("offset", function(d) { return d.offset; })
    //     .attr("stop-color", function(d) { return d.color; });
    
    // legendWrapper
    //     .append("rect")
    //     .attr("x",0)
    //     .attr("y",margin.top)
    //     .attr("width",20)
    //     .attr("height",200)
    //     .attr("fill","url(#linear-gradient)")
    //     // .attr("fill","blue")
    //     .style("opacity",0.7);
    
    // let colorBarDomain=domains[i].map(d=>d.toFixed(0));
    // let colorBardRange=[lg_h,lg_h*0.75,lg_h*0.5,lg_h*0.25,0];
    
    // legendWrapper.append("g")
    //     .attr("transform",`translate(${lg_x+lg_w},${lg_y})`)
    //     .call(d3.axisRight(d3.scaleOrdinal().domain(colorBarDomain).range(colorBardRange)));


}

function showData() {
    let scatter_embs=store.scatter_dict;
    let swing_embs=store.swing_dict;

    embsScatter(scatter_embs);
    multiHeatMap(swing_embs);
}
loadData().then(showData);
