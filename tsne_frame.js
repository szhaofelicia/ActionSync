let store={
    "selected_frame":null,
}
const action="bbgame_swing_ball";
const split="train";
const date="0815";
const json_path=`data/${action}_${split}_${date}_200_embs.csv`;
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
    var height=d3.select(".mainview")
        .style("height")
        .slice(0,-2);
    const margin={top:80,bottom:30,left:50,right:50};

    var maxWidth=d3.min([width*0.7,800]);
    var maxHeight=d3.min([height*0.5,500]);

    var svg=d3.select("#Scatter")
        .attr("width","100%")
        .attr("height","100%")
        // .style("font","14px");

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

    var xScale=d3.scaleLinear()
        .range([0,maxWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsne)[0]*1.1)))
    var yScale=d3.scaleLinear()
        .range([maxHeight,0])
        .domain(d3.extent(embs.map(a=> eval(a.tsne)[1]*1.1)))
    
    const pointSize=75;
    const pointOpacity=0.3;
    const actions=["Swing","Ball"];


    var points=body.selectAll(".point")
    points.data(embs).enter()
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
        .attr("id",function(d,i) {
            return i.toString();})

            
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
    
    // Add colorbars
    const lg_w=20;
    const lg_h=150;
    var lg_x;
    var lg_y;
    var defs=svg.append("defs");
    var linearGradient;
    for(var i=0;i<2;i++) {
        lg_x=maxWidth+i*lg_w*2.5+50;
        lg_y=maxHeight-lg_h;

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

        body.append("rect")
            .attr("x",lg_x)
            .attr("y",lg_y)
            .attr("width",lg_w)
            .attr("height",lg_h)
            .attr("fill","url(#linear-gradient-"+i+")")
            .style("opacity",0.7);
        
        let colorBarDomain=domains[i].map(d=>d.toFixed(0));
        let colorBardRange=[lg_h,lg_h*0.75,lg_h*0.5,lg_h*0.25,0];
        
        body.append("g")
            .attr("transform",`translate(${lg_x+lg_w},${lg_y})`)
            .call(d3.axisRight(d3.scaleOrdinal().domain(colorBarDomain).range(colorBardRange)));
        
        // Action legend
        body.append("path")
            .attr("id","marker"+i)
            .attr("d",d3.symbol().size("150").type(function() {
                if (i==0) {
                    return d3.symbolCircle;
                }else {
                    return d3.symbolTriangle;
                }
            }))
            .attr("transform",`translate(${maxWidth+60},${50+i*lg_h*0.15})`)
            .attr("width",lg_w)
            .attr("height",lg_h*0.25)
            .attr("fill",colors[i][4])
            .attr("fill-opacity",pointOpacity)
        body.append("text")
            .style("font-size","12px")
            .style("text-anchor","start")
            .attr("transform",`translate(${maxWidth+75},${55+i*lg_h*0.15})`)
            .attr("fill","#000000")
            .text(() => (actions[i]));   
    }
    // Add legend titles
    body.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("transform",`translate(${maxWidth+50},${lg_y-10})`)
        .attr("fill","#000000")
        .text("DTW Order");   
    body.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("transform",`translate(${maxWidth+50},${35})`)
        .attr("fill","#000000")
        .text("Actions"); 
            
    var voronoiDiagram=d3.voronoi(embs)
        .x(d => xScale(eval(d.tsne)[0]))
        .y(d => yScale(eval(d.tsne)[1]))
        .size([maxWidth,maxHeight])(embs);
    
    const voronoiRadius=maxWidth/30;
    
    body.append("path")
        .attr("class","highlight-point")
        .style("display","none")
        .style("fill", "none")
    
    body.append("path")
        .attr("class","selected-point")
        .style("display","none")
        .style("fill", "none")
    
    var tooltip=d3.select("#TSNE")
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
                    Action: ${actions[+d.seq_labels]} </br>
                    Video: ${d.names.slice(2,-1)} </br>
                    Frame: ${d.steps}/${d.seq_lens-1} </br>
                    DTW label: ${d.dtw}
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
    }

    function mouseMoveOut() {
        highlight(null);
    }

    function resetClick() {
        d3.select(".selected-point").style("display","none");
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

    d3.select("#Scatter").on("click", resetClick);

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

function displayImage() {
    var width=d3.select(".rightview")
        .style("width")
        .slice(0,-2);
    var height=d3.select(".rightview")
        .style("height")
        .slice(0,-2);
    const margin={top:80,bottom:30,left:100,right:50};
    const image_url="https://baseballgameactivities.s3.us-east-2.amazonaws.com/";

    var maxWidth=d3.min([width*0.7,1280]);
    var maxHeight=maxWidth*720/1280;

    var svg=d3.select("#Frame")
        .attr("width","100%")
        .attr("height","100%");

    svg.append("svg:image")
        .attr("xlink:href",image_url+"ball/1OXKJPPE26HJ0000.jpg")
        .attr("x",margin.left)
        .attr("y",margin.top)
        .attr("width", maxWidth)
        .attr("height", maxHeight);
    console.log(store.selected_frame);
}

function showData() {
    let embs=store.embs_dict;

    embsScatter(embs);
    displayImage();
}
loadData().then(showData);
