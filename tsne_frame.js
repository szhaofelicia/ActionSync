let store={
    "selected_frame":null,
}
const action="bbgame_swing_ball";
const split="train";
const date="0815";

const emb_path=`data/${action}_${split}_${date}_84videos_embs_patch.csv`;
const vector_path=`data/${action}_${split}_${date}_84videos_vector.csv`;
const event_path=`data/video_events.json`;

const extention_id="chrome-extension://ihckakjjeajfccjdbhgeedageimiomio/";
const activities=["swing","ball"];
const reference=[["H2RJ33BPVBQ4", "D8VI1WQ5GFI0", "NM9MYF2F8620"],["4X7I2ILNXO0P","0N6NTL740URF","4SSFIK1YVJ2D"]]
const reference_idx=[[1642,1907,2063],[2391,5692,3323]]
const featureDomains=["image","left","right"];

var ballRef="step";
var swingRef="step";

function loadData() {
    return Promise.all([
        d3.csv(emb_path),
        d3.csv(vector_path),
        d3.json(event_path)
    ]).then(datasets =>{
        store.scatter_dict=datasets[0];
        store.video_vec=datasets[1];
        store.video_events=datasets[2];
        return store;
    })
}

function embsScatter(embs) {
    var width=d3.select("#tsne")
        .style("width")
        .slice(0,-2);

    const margin={top:20,bottom:30,left:20,right:30, intervalX:30, intervalY:50};


    var maxWidth=d3.min([width*0.90,1500]);
    var maxHeight=d3.min([width*0.5,400]);

    var svg=d3.select("#scatter")
        .style("width",maxWidth+margin.left+margin.right)
        .style("height",maxHeight+margin.top+margin.bottom)

    var body=svg.append("g")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`);

    var dtwAArray=[];
    var dtwBArray=[];
    for (let d=0;d<embs.length;d++) {
        if (+embs[d].label==0) {
            dtwAArray.push(+embs[d].step);// default:dtw1
        }else{
            dtwBArray.push(+embs[d].step); // default:dtw1
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

    var imgWidth=maxWidth*0.6;
    var patchWidth= maxWidth*0.4;

    // Image embeddings 
    var xScaleImg=d3.scaleLinear()
        .range([0,imgWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsneImg)[0]*1.1)))
    var yScaleImg=d3.scaleLinear()
        .range([maxHeight,0])
        .domain(d3.extent(embs.map(a=> eval(a.tsneImg)[1]*1.1)))
    
    var xScaleLeft=d3.scaleLinear()
        .range([margin.intervalX+imgWidth,margin.intervalX+imgWidth+patchWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsneL)[0]*1.1)))
    var yScaleLeft=d3.scaleLinear()
        .range([maxHeight*0.45,0])
        .domain(d3.extent(embs.map(a=> eval(a.tsneL)[1]*1.1)))

    var xScaleLeft=d3.scaleLinear()
        .range([0,patchWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsneL)[0]*1.1)))
    var yScaleLeft=d3.scaleLinear()
        .range([maxHeight*0.45,0])
        .domain(d3.extent(embs.map(a=> eval(a.tsneL)[1]*1.1)))

    var xScaleRight=d3.scaleLinear()
        .range([margin.intervalX+imgWidth,margin.intervalX+imgWidth+patchWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsneR)[0]*1.1)))
    var yScaleRight=d3.scaleLinear()
        .range([maxHeight*0.9+margin.intervalY,maxHeight*0.45+margin.intervalY])
        .domain(d3.extent(embs.map(a=> eval(a.tsneR)[1]*1.1)))
    
    var xScaleRight=d3.scaleLinear()
        .range([0,patchWidth])
        .domain(d3.extent(embs.map(a=> eval(a.tsneR)[0]*1.1)))
    var yScaleRight=d3.scaleLinear()
        .range([maxHeight*0.45,0])
        .domain(d3.extent(embs.map(a=> eval(a.tsneR)[1]*1.1)))
    
    //////////////////////////////////////////////////////
    /////////////////// Opacity Slider ///////////////////
    var pointOpacity=0.7;

    ///////svgupdate = () => {
    //     output.innerHTML = slider.value+"%";
    //     pointOpacity=slider.value/100;
    // }
    // slider.addEventListener("input",update);
    // update();

    //////////////////////////////////////////////////////
    /////////////////// Scatter Plot /////////////////////
    //////////////////////////////////////////////////////
    const pointSize=50; //200:75

    var points=body.append("g")
        .attr("class","pointsWrapper");

    // Image embeddings
    points.selectAll("point-image")
        .data(embs).enter()
        .append("path")
        .attr("class","point-image")
        .attr("d",d3.symbol().size(pointSize).type(function(d) {
            if(+d.label==0) {
                return d3.symbolCircle;
            }else{
                return d3.symbolTriangle;
            }
        }))
        .attr("transform",function(d) {
            return `translate(${xScaleImg(eval(d.tsneImg)[0])},${yScaleImg(eval(d.tsneImg)[1])})`;
        })
        .attr("fill-opacity",
            pointOpacity 
            // function(d) {
            //     if(+d.label==0) {
            //         return pointOpacity;
            //     }else{
            //         return 0.02;
            //     }
            // }
        )
        .attr("fill",function(d) {
            if(+d.label==0) {
                return colorScaleA(d[swingRef])
            }else{
                return colorScaleB(d[ballRef])
            }
        })
        .attr("id",function(d) {
            return d.id.toString();})
        .attr("visibility","visible")
    
    // Left Patch embeddings
    points.selectAll("point-left")
        .data(embs).enter()
        .append("path")
        .attr("class","point-left")
        .attr("d",d3.symbol().size(pointSize*0.5).type(function(d) {
            if(+d.label==0) {
                return d3.symbolCircle;
            }else{
                return d3.symbolTriangle;
            }
        }))
        .attr("transform",function(d) {
            return `translate(${margin.intervalX+imgWidth+xScaleLeft(eval(d.tsneL)[0])},${yScaleLeft(eval(d.tsneL)[1])})`;
        })
        .attr("fill-opacity",
            pointOpacity 
            // function(d) {
            //     if(+d.label==0) {
            //         return pointOpacity;
            //     }else{
            //         return 0.02;
            //     }
            // }
        )
        .attr("fill",function(d) {
            if(+d.label==0) {
                return colorScaleA(d[swingRef])
            }else{
                return colorScaleB(d[ballRef])
            }
        })
        .attr("id",function(d) {
            return d.id.toString();})
        .attr("visibility","visible")


    // Right Patch embeddings
    points.selectAll("point-right")
        .data(embs).enter()
        .append("path")
        .attr("class","point-right")
        .attr("d",d3.symbol().size(pointSize*0.5).type(function(d) {
            if(+d.label==0) {
                return d3.symbolCircle;
            }else{
                return d3.symbolTriangle;
            }
        }))
        .attr("transform",function(d) {
            return `translate(${margin.intervalX+imgWidth+xScaleRight(eval(d.tsneR)[0])},${margin.intervalY+maxHeight*0.45+yScaleRight(eval(d.tsneR)[1])})`;
        })
        .attr("fill-opacity",
            pointOpacity 
            // function(d) {
            //     if(+d.label==0) {
            //         return pointOpacity;
            //     }else{
            //         return 0.02;
            //     }
            // }
        
        )
        .attr("fill",function(d) {
            if(+d.label==0) {
                return colorScaleA(d[swingRef])
            }else{
                return colorScaleB(d[ballRef])
            }
        })
        .attr("id",function(d) {
            return d.id.toString();})
        .attr("visibility","visible")


    svg.append("text")
        .attr("x", margin.left*0.5)
        .attr("y", margin.top*0.6)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .text("Embedding of images");

    svg.append("text")
        .attr("x", margin.left+imgWidth)
        .attr("y", margin.top*0.6)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .text("Embedding of left patches");

    svg.append("text")
        .attr("x", margin.left+imgWidth)
        .attr("y", margin.top+maxHeight*0.5+10)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .text("Embedding of right patches");


    //////////////////////////////////////////////////////
    //////////////// Scatter Plot Axis ///////////////////
    //////////////////////////////////////////////////////
    var axisXImg=d3.axisBottom(xScaleImg).tickSize(0);
    var axisYImg=d3.axisLeft(yScaleImg).tickSize(0);

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
        .attr("id","axisXImg")
        .style("font","12px")
        .style("transform",`translate(${margin.left}px,${margin.top+maxHeight}px)`)
        .call(axisXImg)
    svg.select("#axisXImg path.domain")
        .attr("marker-end","url(#arrowhead-right)");

    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",(margin.left+imgWidth)*.5)
        .attr("y",margin.top+maxHeight+20)
        .attr("fill","#1A1A1A")
        .text("x");  

    svg.append("g")
        .attr("id","axisYImg")
        .style("font","12px")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`)
        .call(axisYImg)
    svg.select("#axisYImg path.domain")
        .attr("marker-end","url(#arrowhead-top)");
    
    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",10)
        .attr("y",(margin.top+maxHeight)*0.5-5)
        .attr("fill","#1A1A1A")
        .text("y");  
    

    var axisXLeft=d3.axisBottom(xScaleLeft).tickSize(0);
    var axisYLeft=d3.axisLeft(yScaleLeft).tickSize(0);

    svg.append("g")
        .attr("id","axisXLeft")
        .style("font","12px")
        .style("transform",`translate(${margin.left+imgWidth+margin.intervalX}px,${margin.top+maxHeight*0.45}px)`)
        .call(axisXLeft)
    svg.select("#axisXLeft path.domain")
        .attr("marker-end","url(#arrowhead-right)");

    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",margin.left+imgWidth+margin.intervalX+patchWidth*0.5)
        .attr("y",margin.top+maxHeight*0.45+20)
        .attr("fill","#1A1A1A")
        .text("x");  

    svg.append("g")
        .attr("id","axisYLeft")
        .style("font","12px")
        .style("transform",`translate(${margin.left+imgWidth+margin.intervalX}px,${margin.top}px)`)
        .call(axisYLeft)
    svg.select("#axisYLeft path.domain")
        .attr("marker-end","url(#arrowhead-top)");
    
    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",margin.left+imgWidth-5)
        .attr("y",margin.top+maxHeight*0.25)
        .attr("fill","#1A1A1A")
        .text("y");  
    
    var axisXRight=d3.axisBottom(xScaleRight).tickSize(0);
    var axisYRight=d3.axisLeft(yScaleRight).tickSize(0);

    svg.append("g")
        .attr("id","axisXRight")
        .style("font","12px")
        .style("transform",`translate(${margin.left+imgWidth+margin.intervalX}px,${margin.top+maxHeight*0.9+margin.intervalY}px)`)
        .call(axisXRight)
    svg.select("#axisXRight path.domain")
        .attr("marker-end","url(#arrowhead-right)");
    
    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",margin.left+imgWidth+margin.intervalX+patchWidth*0.5)
        .attr("y",margin.top+maxHeight*0.9+margin.intervalY+20)
        .attr("fill","#1A1A1A")
        .text("x");  

    svg.append("g")
        .attr("id","axisYRight")
        .style("font","12px")
        .style("transform",`translate(${margin.left+imgWidth+margin.intervalX}px,${margin.top+maxHeight*0.45+margin.intervalY}px)`)
        .call(axisYRight)
    svg.select("#axisYRight path.domain")
        .attr("marker-end","url(#arrowhead-top)");
        
    svg.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",margin.left+imgWidth-5)
        .attr("y",margin.top+maxHeight*0.75)
        .attr("fill","#1A1A1A")
        .text("y");  
    
    //////////////////////////////////////////////////////
    //////////////// Select Reference ////////////////////
    //////////////////////////////////////////////////////

    var swingBtn=document.querySelector("#swingButton");
    var swingDropdown=document.querySelector("#swing-dropdown");
    var swingOptions=document.querySelectorAll(".swing-option a");

    const swingMenu=swingBtn.innerHTML;

    var ballBtn=document.querySelector("#ballButton");
    var ballDropdown=document.querySelector("#ball-dropdown");
    var ballOptions=document.querySelectorAll(".ball-option a");

    const ballMenu=ballBtn.innerHTML;

    //update color
    let updateColor = () => {
        body.selectAll(".point-image,.point-left,.point-right")
            .attr("fill",function(d) {
                if(+d.label==0) {
                    return colorScaleA(d[swingRef])
                }else{
                    return colorScaleB(d[ballRef])
                }
            })
    }

    // Reset dropdown selection
    swingBtn.addEventListener("click", function(e) {
        e.preventDefault(swingBtn.innerHTML);
        if (swingBtn.textContent!=swingMenu){
            swingBtn.innerHTML =swingMenu;
        }
    });

    var swingClickFn = function(e) {
        e.preventDefault();
     
        swingDropdown.classList.remove("open");
        swingBtn.innerHTML = this.text;
        if (this.text.slice(-1)!=0){
            swingRef="dtw"+this.text.slice(-1);
        }
        var activeLink = document.querySelector(".swing-option .active")
     
        if (activeLink) {
           activeLink.classList.remove("active");
        }
     
        this.classList.add("active");
        updateColor();

    }
     
    for (var i = 0; i < swingOptions.length; i++) {
        swingOptions[i].addEventListener("mousedown", swingClickFn, false);
    }


    // Reset dropdown selection
    ballBtn.addEventListener("click", function(e) {
        e.preventDefault(ballBtn.innerHTML);
        if (ballBtn.textContent!=ballMenu){
            ballBtn.innerHTML =ballMenu;
        }
    });


    var ballClickFn = function(e) {
        e.preventDefault();
     
        ballDropdown.classList.remove("open");
        ballBtn.innerHTML = this.text;
        if (this.text.slice(-1)!=0){
            ballRef="dtw"+this.text.slice(-1);
        }

        var activeLink = document.querySelector(".ball-option .active")
     
        if (activeLink) {
           activeLink.classList.remove("active");
        }
     
        this.classList.add("active");
        updateColor();
    }
     
    for (var i = 0; i < ballOptions.length; i++) {
        ballOptions[i].addEventListener("mousedown", ballClickFn, false);
    }

    

    //////////////////////////////////////////////////////
    /////////////////// Action Legend ////////////////////
    //////////////////////////////////////////////////////
    // Legend SVG
    var legendWidth=d3.select("#legend")
        .style("width")
        .slice(0,-2);
    var svgLegend=d3.select("#actionLegend")
        .style("width",legendWidth)
        .style("height",maxHeight)
    var legendWrapper=svgLegend.append("g").attr("class", "legendWrapper")
        .style("transform",`translate(${margin.left}px,${margin.top*.5}px)`);

    const marker_h=25;
    const lg_w=20;
    const lg_h=150;
    
    ///////////////////////////////////////////////////////////////////////////
    ////////////////// Hover & Click functions for legend /////////////////////
    ///////////////////////////////////////////////////////////////////////////
    
    // body.append("path")
    //     .attr("class","reference-point")
    //     .style("display","none")
    //     .style("fill", "none")

    //Decrease opacity of non selected circles when hovering in the legend	
    function selectLegend(opacity) {
        return function(d, i) {
            var chosen =i;
                
            body.selectAll(".point-image,.point-left,.point-right")
                .filter(function(d) { return d.label != chosen; })
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
        var ref_video= null;
        if (i==0 && swingRef!="step"){
            ref_video=reference[i][+swingRef.slice(-1)-1]
        }else if(i==1 && ballRef!="step") {
            ref_video=reference[i][+ballRef.slice(-1)-1]
        }
                
        //Only show the markers of the chosen sector
        body.selectAll(".point-image")
            .style("opacity", function(d) {
                if (d.video == ref_video) return 1;
                else return 0.1;})
            .style("visibility", function(d) {
                if (d.label != i) return "hidden";
                else return "visible";})
            .attr("d",d3.symbol().size(function(d,i) {
                if (d.video == ref_video) return pointSize*1.5;
                else return pointSize;})
            .type(function(d) {
                if(+d.label==0) return d3.symbolCircle;
                else return d3.symbolTriangle;}))
            .style("stroke",colors[i][4])
            .style("stroke-opacity", 1)
            .style("stroke-width", function(d) {
                if (d.video == ref_video) return "1px";
                else return "0px";
            })
        
        body.selectAll(".point-left,.point-right")
            .style("opacity", function(d) {
                if (d.video == ref_video) return 1;
                else return 0.1;})
            .style("visibility", function(d) {
                if (d.label != i) return "hidden";
                else return "visible";})
            .attr("d",d3.symbol().size(function(d,i) {
                if (d.video == ref_video) return pointSize*0.75;
                else return pointSize*0.5;})
            .type(function(d) {
                if(+d.label==0) return d3.symbolCircle;
                else return d3.symbolTriangle;}))
            .style("stroke",colors[i][4])
            .style("stroke-opacity", 1)
            .style("stroke-width", function(d) {
                if (d.video == ref_video) return "1px";
                else return "0px";
            })
                
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
        .text("Temporal Order");   

    //////////////////////////////////////////////////////
    ///////////////// Scatter selection //////////////////
    //////////////////////////////////////////////////////
    const voronoiRadius=maxWidth/30;

    var voronoiDiagramImg=d3.voronoi(embs)
        .x(d => xScaleImg(eval(d.tsneImg)[0]))
        .y(d => yScaleImg(eval(d.tsneImg)[1]))
        .size([imgWidth,maxHeight])(embs);

    var voronoiDiagramLeft=d3.voronoi(embs)
        .x(d => xScaleLeft(eval(d.tsneL)[0]))
        .y(d => yScaleLeft(eval(d.tsneL)[1]))
        .size([patchWidth,maxHeight*0.45])(embs);

    var voronoiDiagramRight=d3.voronoi(embs)
        .x(d => xScaleRight(eval(d.tsneR)[0]))
        .y(d => yScaleRight(eval(d.tsneR)[1]))
        .size([patchWidth,maxHeight*0.45])(embs);

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

    function highlight (d,top,left,points=pointSize) {
        if (!d) {
            d3.select(".highlight-point").style("display","none");
        }else {
            d3.select(".highlight-point")
                .style("display","")
                .attr("d",d3.symbol().size(points).type(function() {
                    if(+d.label==0) {
                        return d3.symbolCircle;
                    }else{
                        return d3.symbolTriangle;
                    }}))
                .attr("transform",function() {
                    return `translate(${left},${top})`;})
                .style("stroke", "gray")
                .style("stroke-dasharray", ("3, 2"))
                .style("stroke-width", "1px")
                .style("stroke-opacity", 1);
        }
    }

    function clicked (d,top,left,pointS=pointSize) {
        if (d) {
            d3.select(".selected-point")
                .style("display","")
                .attr("d",d3.symbol().size(pointS).type(function() {
                    if(+d.label==0) {
                        return d3.symbolCircle;
                    }else{
                        return d3.symbolTriangle;
                    }}))
                .attr("transform",function() {
                    return `translate(${left},${top})`;})
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("stroke-opacity", 1);
            
        }
    }
    
    function tooltipDisplay(d,top,left) {
        if (!d) {
            tooltip.style("opacity", 0);
        }else {
            if(+d.label==0){
                var dtw_order=d[swingRef];
            } else{
                var dtw_order=d[ballRef];
            }
            tooltip
                .html(`
                    Action: ${activities[+d.label]} </br>
                    Video: ${d.video} </br>
                    Frame: ${d.step}/${d.length-1} </br>
                    DTW label: ${dtw_order} </br>
                    `)
                .style("opacity", 1)
                .style("left",margin.left+left+20+"px")
                .style("top",margin.top+top-20+"px");
        }
    }
    // Optical flow: ${(+d.flow).toFixed(2)} 


    function mouseMoveOut() {
        highlight(null);
    }

    function resetClick() {
        d3.selectAll(".selected-point").style("display","none");

        d3.selectAll(".legendMarker")
            .on("mouseover", selectLegend(0.02))
            .on("mouseout", selectLegend(pointOpacity));

        body.selectAll(".point-image,.point-left,.point-right")
            .style("opacity", 1)
            .style("visibility", "visible")
            .style("stroke-width",  "0px")

        var queryImg = document.getElementById("queryImage");
        if (queryImg) {
            queryImg.style.visibility="hidden";
        }
        var referenceImg = document.getElementById("referenceImage");
        if (referenceImg) {
            referenceImg.style.visibility="hidden";
        }

        var myQuery=document.getElementById("query")
        var ctxQ=myQuery.getContext("2d");
        ctxQ.clearRect(0, 0, myQuery.width, myQuery.height);

        var myReference=document.getElementById("reference")
        var ctxR=myReference.getContext("2d");
        ctxR.clearRect(0, 0, myReference.width, myReference.height);

    }

    body.append("rect")
        .attr("class", "overlay-image")
        .attr("width", imgWidth) 
        .attr("height", maxHeight)
        .style("fill", "#f00")
        .style("fill-opacity", 0)
        .on("mousemove", mouseMoveHandler=function() {
            // get the current mouse position
            const [mx, my] = d3.mouse(this);
            const site = voronoiDiagramImg.find(mx, my, voronoiRadius);

            var selected=site && site.data;
            var top,left;
            if (selected){
                top=yScaleImg(eval(selected.tsneImg)[1]);
                left=xScaleImg(eval(selected.tsneImg)[0]);
            }


            // highlight the point if we found one
            highlight(selected,top,left);
            tooltipDisplay(selected,top,left);
        })
        .on("mouseleave", mouseMoveOut)            
        .on("click", mouseClickHandler=function () {
            // get the current mouse position
            event.stopPropagation();
    
            const [mx, my] = d3.mouse(this);
            const site = voronoiDiagramImg.find(mx, my, voronoiRadius);

            var selected=site && site.data;
            var top,left;
            if (selected){
                top=yScaleImg(eval(selected.tsneImg)[1]);
                left=xScaleImg(eval(selected.tsneImg)[0]);
                            // highlight the point if we found one
                clicked(selected,top,left);
                showSelectedImage(+selected.id);
            }
    

        });


    body.append("rect")
        .attr("class", "overlay-left")
        .attr("width", patchWidth) 
        .attr("height", maxHeight*0.45)
        .style("transform",`translate(${imgWidth+margin.intervalX}px,${0}px)`)
        .style("fill", "#f00")
        .style("fill-opacity", 0)
        .on("mousemove", mouseMoveHandler=function() {
            // get the current mouse position
            const [mx, my] = d3.mouse(this);
            const site = voronoiDiagramLeft.find(mx, my, voronoiRadius);

            var selected=site && site.data;
            var top,left;
            if (selected){
                var left=imgWidth+margin.intervalX+ xScaleLeft(eval(selected.tsneL)[0]);
                var top=yScaleLeft(eval(selected.tsneL)[1]);
            }

            // highlight the point if we found one
            highlight(selected,top,left,pointSize*0.5);
            tooltipDisplay(selected,top,left);
        })
        .on("mouseleave", mouseMoveOut)            
        .on("click", mouseClickHandler=function () {
            // get the current mouse position
            event.stopPropagation();
    
            const [mx, my] = d3.mouse(this);
            const site = voronoiDiagramLeft.find(mx, my, voronoiRadius);

            var selected=site && site.data;
            var top,left;
            if (selected){
                var top=yScaleLeft(eval(selected.tsneL)[1]);
                var left=imgWidth+margin.intervalX+xScaleLeft(eval(selected.tsneL)[0]);
            }

            // highlight the point if we found one
            clicked(selected,top,left,pointSize*0.5);
            showSelectedImage(+selected.id);
    
        });

    body.append("rect")
        .attr("class", "overlay-right")
        .attr("width", patchWidth) 
        .attr("height", maxHeight*0.45)
        .style("transform",`translate(${imgWidth+margin.intervalX}px,${margin.intervalY+maxHeight*0.45}px)`)
        .style("fill", "#f00")
        .style("fill-opacity", 0)
        .on("mousemove", mouseMoveHandler=function() {
            // get the current mouse position
            const [mx, my] = d3.mouse(this);
            const site = voronoiDiagramRight.find(mx, my, voronoiRadius);

            var selected=site && site.data;
            var top,left;
            if (selected){
                var left=imgWidth+margin.intervalX+ xScaleRight(eval(selected.tsneR)[0]);
                var top=margin.intervalY+maxHeight*0.45+yScaleRight(eval(selected.tsneR)[1]);
            }

            // highlight the point if we found one
            highlight(selected,top,left,pointSize*0.5);
            tooltipDisplay(selected,top,left);
        })
        .on("mouseleave", mouseMoveOut)            
        .on("click", mouseClickHandler=function () {
            // get the current mouse position
            event.stopPropagation();
    
            const [mx, my] = d3.mouse(this);
            const site = voronoiDiagramRight.find(mx, my, voronoiRadius);

            var selected=site && site.data;
            var top,left;
            if (selected){
                var left=imgWidth+margin.intervalX+ xScaleRight(eval(selected.tsneR)[0]);
                var top=margin.intervalY+maxHeight*0.45+yScaleRight(eval(selected.tsneR)[1]);
            }

            // highlight the point if we found one
            clicked(selected,top,left,pointSize*0.5);
            showSelectedImage(+selected.id);
    
        });



    d3.select("#ActionLegend").on("click", resetClick);

    //////////////////////////////////////////////////////
    /////////////////// Lasso functions //////////////////
    //////////////////////////////////////////////////////
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

        // resetClick(); // deactivate selected point by click

        var selectedPoints=lasso.selectedItems()._groups[0];
        if (selectedPoints.length>0){
            var centerIdx=CenterPointer(embs,selectedPoints)
            showSelectedImage(centerIdx);
        }

    };
    
    var lasso = d3.lasso()
        .closePathSelect(true)
        .closePathDistance(100)
        .items(d3.selectAll(".point-image,.point-left,.point-right"))
        .targetArea(d3.select("#Scatter"))
        .on("start",lasso_start)
        .on("draw",lasso_draw)
        .on("end",lasso_end);
    
    svg.call(lasso);
}

function CenterPointer(embs,points) {

    var space=points[0].className.baseVal.split(" ")[0].split("-")[1];

    if (space=="imgae"){
        var embType="tsneImg"
    }else if(space=="left"){
        var embType="tsneL";
    }else{
        var embType="tsneR";
    }

    var idxs=points.map(a=>+a.id);
    var tsnes=[];
    var total=[0,0];
    var average=[0,0];
    var dist=[];
    for (let i=0;i<idxs.length;i++) {
        tsnes.push(eval(embs[idxs[i]][embType]));
        total[0]+=eval(embs[idxs[i]][embType])[0];
        total[1]+=eval(embs[idxs[i]][embType])[1];
    }
    average[0]=total[0]/idxs.length;
    average[1]=total[1]/idxs.length;
    for (let i=0;i<idxs.length;i++) {
        let norm_dist=Math.pow(tsnes[i][0]-average[0],2)+Math.pow(tsnes[i][1]-average[1],2);
        dist.push(norm_dist);
    }

    return idxs[dist.indexOf(Math.min(...dist))];
}


function videoHeatmap(vectors,videoEvents,action="swing") {
    var width=d3.select("#swingVideo")
        .style("width")
        .slice(0,-2);
    const margin={top:50,bottom:20,left:120,right:30, intervalX:100, intervalY:50};
    const videoSamples={
        "swing":[{"vidx":165,"cluster":2,"video":"H2RJ33BPVBQ4"},{"vidx":175,"cluster":6,"video":"D8VI1WQ5GFI0"},{"vidx":198,"cluster":0,"video":"NM9MYF2F8620"},
            {"vidx":86,"cluster":6,"video":"MN0RZJGOBTJZ"},{"vidx":137,"cluster":0,"video":"CI7I88Z16L4C"},{"vidx":118,"cluster":4,"video":"0ZZOMDIRKUHT"},
            {"vidx":106,"cluster":4,"video":"OOMWCSDU09JV"}, {"vidx":14,"cluster":0,"video":"CO24TQ52TXCF"},{"vidx":185,"cluster":3,"video":"O35GBDO4IA6O"},
            {"vidx":68,"cluster":6,"video":"G7VR5IJV0IAX"}, {"vidx":61,"cluster":2,"video":"3MZWXKNR08QJ"},{"vidx":105,"cluster":4,"video":"B6ZDY1EVJCSJ"},
            {"vidx":81,"cluster":3,"video":"N495HRUNVOOZ"},{"vidx":201,"cluster":1,"video":"I9B4I1HQERAT"},{"vidx":110,"cluster":2,"video":"KE1GU5GWBSCF"},
            {"vidx":158,"cluster":7,"video":"8R2HHRIJG73A"},  {"vidx":40,"cluster":3,"video":"MCE1ZFDBM4PR"},{"vidx":167,"cluster":7,"video":"HKWI4IVGNBSL"},
            {"vidx":135,"cluster":7,"video":"GHD9ZYPBWH9G"},{"vidx":188,"cluster":0,"video":"ES16TY3TT09O"},{"vidx":149,"cluster":3,"video":"QSGJHSYQI11P"},
            {"vidx":113,"cluster":3,"video":"EN93W3KUIDPR"},{"vidx":130,"cluster":3,"video":"BNPP45GVM0QJ"},{"vidx":169,"cluster":3,"video":"JYMR81NQQN4Z"},
            {"vidx":9,"cluster":3,"video":"KDV4OD86Z155"},{"vidx":162,"cluster":3,"video":"A71JFN2AHMQ9"}],
        
        "ball":[{"vidx":15,"cluster":1,"video":"0N6NTL740URF"},{"vidx":200,"cluster":1,"video":"4X7I2ILNXO0P"},{"vidx":91,"cluster":1,"video":"4SSFIK1YVJ2D"},
        {"vidx":24,"cluster":4,"video":"5NHV6UB2NYWL"},{"vidx":63,"cluster":1,"video":"6L8P2HJBWN94"},{"vidx":171,"cluster":4,"video":"2E8Y710KD7K8"},
        {"vidx":114,"cluster":1,"video":"0EGDSB6I18DC"},{"vidx":182,"cluster":6,"video":"AYMU7BHW5EF1"},{"vidx":190,"cluster":4,"video":"2VE5WCLDYGO3"},
        {"vidx":41,"cluster":6,"video":"9O01680UWDKM"},{"vidx":8,"cluster":6,"video":"5CMCHLR8YI21"},{"vidx":163,"cluster":7,"video":"9L9XEHJFMAPR"},
        {"vidx":101,"cluster":6,"video":"4OTCA5P3UZZV"},{"vidx":149,"cluster":2,"video":"6BPO6VW5A482"},{"vidx":69,"cluster":7,"video":"7R8F910D6A25"},
        {"vidx":6,"cluster":0,"video":"70TR1XOSU3G2"},{"vidx":59,"cluster":7,"video":"2BFBWNJINMS9"},{"vidx":71,"cluster":7,"video":"5TZVJJXCZNQ5"},
        {"vidx":168,"cluster":0,"video":"92ILOFDHIIA9"},{"vidx":111,"cluster":0,"video":"8VF4KX0PLVJI"},{"vidx":105,"cluster":7,"video":"36PTBRA0O8DM"},
        {"vidx":118,"cluster":7,"video":"5ZJVH1WG4OUD"},{"vidx":62,"cluster":3,"video":"3VXHB3EI46Z5"},{"vidx":142,"cluster":3,"video":"6429HNMYKU22"},
        {"vidx":199,"cluster":3,"video":"ALFS8ZE44XTI"},{"vidx":18,"cluster":3,"video":"9KQ9IBJQKUA1"}]
    };

    
    const CtCos={"swing":[153,173,2,36,59,76,49,171,5,78,47,11,203,17,112,156],
                    "ball": [17,40,130,133,97,110,140,144,191,136,107,177,159,176,198,145]};
    const clusters={"swingCos":8,"swingEuc":8,"ballCos":8,"ballEuc":8};
    const metric="cosine";

    var heatmapWidth=width*0.25;
    var maxHeight=d3.min([width*0.45,400]);

    var scatterWidth=width*0.2;


    var svgMap=d3.select(`#${action}Heatmap`)
        .style("width",heatmapWidth+margin.left+margin.intervalX)
        .style("height",maxHeight+margin.top+margin.bottom)
    
    var svgVector=d3.select(`#${action}Vector`)
        .style("width",scatterWidth+margin.right)
        .style("height",maxHeight+margin.top+margin.bottom)
    
    var distArray=[];
    for (let d=0;d<vectors.length;d++){
        if (vectors[d].label==activities.indexOf(action)){
           for (s=0;s<eval(vectors[0].samples).length;s++){
               distArray.push(+eval(vectors[d].samples)[s].value)
           } 
        }
    }

    var myXnodes = d3.map(eval(vectors[0].samples), function(d){return d.key;}).keys();
    var maxDist=d3.max(distArray);
    var bodyMap=svgMap.append("g")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`);
    
    var nrows;
    if(metric == "cosine" ){
        nrows= +2*clusters[`${action}Cos`];
    }else{
        nrows= +2*clusters[`${action}Euc`];
    }

    var bandXSw = d3.scaleBand()
        .domain(d3.range(videoSamples[action].length))
        .range([0, heatmapWidth])
        .padding(0.05);
    var bandYSw = d3.scaleBand()
        .domain(d3.range(nrows))
        .range([0, maxHeight])
        .padding(0.05);


    //////////////////////////////////////////////////////
    ////////////////////// Heatmap ///////////////////////
    //////////////////////////////////////////////////////

    var table=bodyMap.append("g")
    .attr("class","heatmap")

    var tooltip=d3.select(`#${action}Video`).append("div")
        .append("g")
        .append("div")
        .attr("class","tooltip")
        .style("opacity",0)
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px");

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        d3.select(this)
            .style("stroke", "black")
            .style('stroke-width', 2)
            .style("opacity", 1);
    }

    var mousemoveRect = function(d,i) {
        var coordinates= d3.mouse(this);
        var x = coordinates[0];
        var y = coordinates[1];
        
        // D3 v4
        x = d3.event.pageX - document.getElementById(`${action}Video`).getBoundingClientRect().x + 10;
        y = d3.event.pageY - document.getElementById(`${action}Video`).getBoundingClientRect().y + 30;

        tooltip
            .html(`
                Video X: ${videoSamples[action][+d.key.slice(-2)].video} </br>
                Idx:${videoSamples[action][+d.key.slice(-2)].vidx} Cluster: ${videoSamples[action][+d.key.slice(-2)].cluster} </br>
                Video Y: ${d.parent.video} </br>
                Idx:${d.parent.vidx} Cluster: ${d.parent.cluster} </br>
                `)
            .style("left", (x+30) + "px")
            .style("top", (y+maxHeight + "px"))
            .style("opacity", 0.7)


        // tooltip
        //     .html(`
        //         Video X: ${videoSamples[action][+d.key.slice(-2)].vidx} (cluster: ${videoSamples[action][+d.key.slice(-2)].cluster}) </br>
        //         Video Y: ${d.parent.vidx} (cluster: ${d.parent.cluster}) </br>
        //         `)
        //     .style("left", (x+30) + "px")
        //     .style("top", (y+maxHeight + "px"))
        //     .style("opacity", 0.7)
    }
    var mouseleave = function(d) {
        tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "none")
            .style("opacity", 0.8)
    }

    var mouseClickRect =function(d) {
        if (d) {
            var vx =videoSamples[action][+d.key.slice(-2)].vidx;
            var vy =d.parent.vidx;

            showEvents(vx,0);
            showEvents(vy,1);

            d3.select(this)
                .style("stroke", "black")
                .style('stroke-width', 2)
                .style("opacity", 1)
            
        }
    }


    var rows=table.selectAll(`.row-${action}`)
        .data(vectors).enter()
        .filter(function(d) { return +d.label == activities.indexOf(action); })
        .filter(function(d) { 
            if (metric=="cosine") return d.centerCos!="False";
            else return d.centerEucli!="False"; })
        .append("g")
        .attr("class",`row-${action}`)
        .attr("transform",function(d,i) {
            return `translate(${0},${bandYSw(+CtCos[action].indexOf(+d.vidx))})`;})
    
    rows.selectAll("rect")
        .data(function(d){
                return d.samples=eval(d.samples);
            }) 
        .data(function(d){
            d.samples.map(function(i){
                return i.parent={
                    "vidx":+d.vidx,"cluster":d.clusterCos,"video":d.video
                }}); 
            return d.samples;}) 
        .enter().append("rect")
        .style("fill",function(d){
            return d3.interpolateInferno(+d.value/maxDist);})
        .style('opacity', 0.8)
        .style("stroke-width", 4)
        .style("stroke", "none")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr('x', function(d, i) {return bandXSw(i);})
        .attr('width', bandXSw.bandwidth())
        .attr('height', bandYSw.bandwidth())
        .on("mouseover", mouseover)
        .on("mousemove", mousemoveRect)
        .on("mouseleave", mouseleave)
        .on("click",mouseClickRect)
    
    svgMap.append("text")
        .attr("x", margin.left*0.5)
        .attr("y", margin.top*0.6)
        .attr("text-anchor", "left")
        .style("font-size", "20px")
        .text("Minimum Alignment Distance");

    svgMap.append("text")
        .attr("x", margin.left+heatmapWidth-30)
        .attr("y", margin.top+maxHeight+20)
        .attr("text-anchor", "left")
        .style("font-size", "12px")
        .text("Video X");
    svgMap.append("text")
        .attr("x", margin.left+heatmapWidth)
        .attr("y", margin.top)
        .attr("text-anchor", "left")
        .style("font-size", "12px")
        .text("Video Y");


    //////////////////////////////////////////////////////
    ////////////////////// Colorbar //////////////////////
    //////////////////////////////////////////////////////

    var distDomain=[0,
        d3.quantile(distArray,0.25),
        d3.quantile(distArray,0.5),
        d3.quantile(distArray,0.75),
        d3.quantile(distArray,1)]


    const marker_h=25;
    const lg_w=20;
    const lg_h=150;

    var lg_x=0;
    var lg_y;
    var defs=svgMap.append("defs");
    var linearGradient;

    lg_y=100+lg_h*.5;

    var legendWrapper=svgMap.append("g").attr("class", "legendWrapper")
    .style("transform",`translate(${margin.left+heatmapWidth+35}px,${margin.top+maxHeight-lg_h-lg_y}px)`);

    linearGradient=defs.append("linearGradient")
        .attr("id",`linear-gradient-${action}`);
    linearGradient
        .attr("x1","100%")
        .attr("y1","100%")
        .attr("x2","100%")
        .attr("y2","0%");
    linearGradient.selectAll("stop")
        .data([
            {offset:"0%",color:d3.interpolateInferno(0)},
            {offset:"25%",color:d3.interpolateInferno(0.25)},
            {offset:"50%",color:d3.interpolateInferno(0.5)},
            {offset:"75%",color:d3.interpolateInferno(0.75)},
            {offset:"100%",color:d3.interpolateInferno(1)},
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
        .attr("fill",`url(#linear-gradient-${action})`)
        .style("opacity",0.7);
    
    let colorBarDomain=distDomain.map(d=>d.toFixed(0));
    let colorBardRange=[lg_h,lg_h*0.75,lg_h*0.5,lg_h*0.25,0];
    
    legendWrapper.append("g")
        .attr("transform",`translate(${lg_x+lg_w},${lg_y})`)
        .call(d3.axisRight(d3.scaleOrdinal().domain(colorBarDomain).range(colorBardRange)));

    legendWrapper.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("transform",`translate(${0},${lg_y-10})`) 
        .attr("fill","#1A1A1A")
        .text("Min Dist");   

    //////////////////////////////////////////////////////
    ////////////////////// Plot Axis /////////////////////
    //////////////////////////////////////////////////////
    var x = d3.scaleBand()
        .range([ 0, heatmapWidth ])
        .domain(myXnodes)
        .padding(0.05);
    svgMap.append("g")
        .style("font-size", 10)
        .attr("transform",function(d,i) {
            return `translate(${margin.left},${maxHeight+margin.top})`;
        })
        .call(d3.axisBottom(x).tickSize(0))
        .select(".domain").remove()

    // var myYnodes = d3.map(vectors, function(d){            
    //     if (metric=="cosine") return + swingCtCos.indexOf(d.clusterCos);
    //     else return d.clusterEucli; 
    //     }).keys()
    var y = d3.scaleBand()
        .range([0, maxHeight])
        .domain(CtCos[action])
        .padding(0.05);

    svgMap.append("g")
        .style("font-size", 12)
        .attr("transform",function(d,i) {
            return `translate(${margin.left+heatmapWidth},${margin.top})`;
        })
        .call(d3.axisRight(y).tickSize(0))
        .select(".domain").remove()


    //////////////////////////////////////////////////////
    ///////////////////// Plot Linkage ///////////////////
    //////////////////////////////////////////////////////

    var yRootDataCos = {
        "swing":
        {totalLength:204,
        children: [
            {length: 124,
                children: [
                    {length: 58,
                        children:
                            [{length:22, key:153},{length:22, key:173}]},
                    {length: 22,
                        children:[{length: 54, 
                                children:[{length:4, key:2},{length:4, key:36}]},
                            {length: 4, 
                                children:[{length:54, key:59},{length:54, key:76}]}]}]},
            {length: 80,
                children: [
                {length: 39,
                        children:
                            [{length: 36, 
                                children:[{length:49, key:49},{length:49, key:171}]},
                            {length: 49, 
                                children:[{length:36, key:5},{length:36, key:78}]}]},
                    {length: 85,
                        children:[
                            {length: 31, 
                                children:[{length:8, key:47},{length:8, key:11}]},
                            {length: 8, 
                                children:[{length:10, 
                                        children:[{length:21, key:203},{length:21, key:17}]},
                                    {length:21, 
                                        children:[{length:10, key:112},{length:10, key:156}]}                                                
                                        ]}
                            ]}
                    ]}
        ]},

        "ball":
        {totalLength:204,
        children: [
            {length: 75,
                children: [
                    {length: 56,
                        children:
                        [{length: 44, 
                            children:[{length:29, key:17},{length:29, key:40}]},
                        {length: 29, 
                            children:[{length:44, key:130},{length:44, key:133}]
                        }]},
                    {length: 73,
                        children:[{length: 17, 
                                children:[{length:39, key:97},{length:39, key:110}]},
                            {length: 39, 
                                children:[{length:17, key:140},{length:17, key:144}]}]}]},
            {length: 129,
                children: [
                    {length: 73,
                            children:
                            [{length:2, key:191},{length:2, key:136}]},
                {length: 2,
                    children:[
                        {length: 49, 
                            children:[{length:24, key:107},{length:24, key:177}]},
                        {length: 24, 
                            children:[{length:38, 
                                    children:[{length:11, key:159},{length:11, key:176}]},
                                {length:11, 
                                    children:[{length:38, key:198},{length:38, key:145}]}]                                             
                        }]
                    }]
                }]}
    };


    var yRootCos = d3.hierarchy(yRootDataCos[action])
                    .sum(function(d) {
                        return d.length;
                    });

    setYLinkScaledY(yRootCos, yRootCos.data.length = 0, margin.left / yRootCos.data.totalLength);
    function setYLinkScaledY(d, y0, k) {
        d.yLinkScaledY = (y0 += d.data.length) * k;
        if (d.children) d.children.forEach(function(d) { setYLinkScaledY(d, y0, k); });
    }

    var yCluster = d3.cluster()
        .size([maxHeight, margin.left])
        .separation(function() {return 1;});

    yCluster(yRootCos);

    var yLinks = svgMap.append('g').attr('class', 'ylinks')
        .attr('transform', 'translate(' + 0 + ',' + (margin.top) + ')');
    yLinks.selectAll('.link')
        .data(yRootCos.descendants().slice(1))
        .enter().append('path')
        .attr('class', 'link')
        .style('fill', 'none')
        .style('stroke', '#000')
        .style('stroke-width', 1)
        .attr("d", function(d) {
            return "M" + d.yLinkScaledY + "," + d.x
                    + "L" + d.parent.yLinkScaledY + "," + d.x
                    + " " + d.parent.yLinkScaledY + "," + d.parent.x;
        });

    // var yNodes = svgSw.append('g').attr('class', 'ynodes')
    //     .attr('transform', 'translate(' + (heatmapWidth + margin.left + 10) + ',' + (linkHeight + margin.top + 4) + ')');
    // yNodes.selectAll('.y-node')
    //     .data(yRoot.descendants())
    //     .enter().append('text')
    //     .attr('class', function(d) {return 'y-node ' + (d.data.key ? d.data.key : '')})
    //     .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; })
    //     .text(function(d) { return d.children ? '' : d.data.key });

    //////////////////////////////////////////////////////
    //////////////////// Scatter Plot ////////////////////
    //////////////////////////////////////////////////////
    
    var colorCluster = d3.scaleOrdinal(d3.schemeSet3); //default: d3.schemeCategory10

    var xScale=d3.scaleLinear()
        .range([0,scatterWidth])
        .domain(d3.extent(vectors.map(a=> eval(a.tsne)[0]*1.1)))
    var yScale=d3.scaleLinear()
        .range([maxHeight*0.6,0])
        .domain(d3.extent(vectors.map(a=> eval(a.tsne)[1]*1.1)))

    var bodyVector=svgVector.append("g")
        .style("transform",`translate(${margin.right}px,${margin.top}px)`);

    var points=bodyVector.append("g")
        .attr("class","pointsWrapper");

    // Image embeddings
    points.selectAll("points")
        .data(vectors).enter()
        .filter(function(d) { 
            return +d.label == activities.indexOf(action); })
        .append("circle")
        .attr("class","points")
        .attr("r", 3.5)
        .attr("cx", function(d) { return xScale(eval(d.tsne)[0]); })
        .attr("cy", function(d) { return yScale(eval(d.tsne)[1]); })
        .attr("fill-opacity",0.85)
        .attr("fill",function(d) {
            if(metric=="cosine")return colorCluster(+d.clusterCos);
            else return colorCluster(+d.clusterEucli);
        })
        .attr("id",function(d) {
            return d.id.toString();})
        .attr("visibility","visible")

    var axisXVector=d3.axisBottom(xScale).tickSize(0);
    var axisYVector=d3.axisLeft(yScale).tickSize(0);

    svgVector.append("defs")
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

    svgVector.append("defs")
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

    svgVector.append("g")
        .attr("id","axisXVector")
        .style("font","12px")
        .style("transform",`translate(${margin.right}px,${margin.top+maxHeight*0.6}px)`)
        .call(axisXVector)
    svgVector.select("#axisXVector path.domain")
        .attr("marker-end","url(#arrowhead-right)");

    svgVector.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",(margin.right+scatterWidth)*.5)
        .attr("y",margin.top+maxHeight*0.6+15)
        .attr("fill","#1A1A1A")
        .text("x");  

    svgVector.append("g")
        .attr("id","axisYVector")
        .style("font","12px")
        .style("transform",`translate(${margin.right}px,${margin.top}px)`)
        .call(axisYVector)
    svgVector.select("#axisYVector path.domain")
        .attr("marker-end","url(#arrowhead-top)");
    
    svgVector.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",5)
        .attr("y",margin.top+maxHeight*0.3+5)
        .attr("fill","#1A1A1A")
        .text("y");  

    var clusterWrapper=svgVector.append("g").attr("class", "clusterWrapper")
        .style("transform",`translate(${margin.right}px,${margin.top+maxHeight*0.6}px)`);


    svgVector.append("text")
        .attr("x", margin.right)
        .attr("y", margin.top*0.6)
        .attr("text-anchor", "left")
        .style("font-size", "20px")
        .text("Video Vector");

    ///////////////////////////////////////////////////////////////////////////
    ////////////////// Hover & Click functions for legend /////////////////////
    ///////////////////////////////////////////////////////////////////////////

    function selectLegend(opacity,i) {
        return function() {
            bodyVector.selectAll(".points")
                .filter(function(d) { 
                    if(metric=="cosine"){
                        var clusterType="clusterCos";
                    }else{
                        var clusterType="clusterEucli";
                    }    
                    return +d[clusterType] != i; })
                .transition()
                .style("opacity", opacity);
        };
    }//function selectLegend

    for(let c=0;c<clusters[`${action}Cos`];c++){
        var i=Math.floor(c/3);
        var j=c%3;
        clusterWrapper
            .append("circle")
            .attr("cx",margin.right+i*100)
            .attr("cy",50+j*20).attr("r", 6)
            .style("fill", colorCluster(c))
            .on("mouseover", selectLegend(0.02,c))
            .on("mouseout", selectLegend(0.85,c));
        clusterWrapper.append("text").attr("x", margin.right+i*100+20).attr("y", 55+j*20).text(`Cluster ${c}`).style("font-size", "15px").attr("alignment-baseline","text-top")

    }
    

    //////////////////////////////////////////////////////
    //////////////////// Video Events ////////////////////
    //////////////////////////////////////////////////////

    const timestamps=videoEvents;
    const evenTypes={"swing":["start","pitcher","batter","end"],"ball":["start","pitcher","catcher","batter","end"]};
    const allVideos=["videoX","videoY"];
    const videoLength={"swing":53,"ball":84};

    var eventWidth=d3.min([width*0.4,600])

    var svgEvent=d3.select(`#${action}Event`)
        .style("width",margin.left+eventWidth+margin.right)
        .style("height",maxHeight+margin.top+margin.bottom)

    var bodyEvent=svgEvent.append("g")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`);

    var lineColor = d3.scaleOrdinal()
        .domain(allVideos)
        .range(d3.schemeSet2);
    
    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
        .domain([0,videoLength[action]])
        .range([ 0, eventWidth ]);
    
    // Add Y axis
    var y = d3.scalePoint()
            .domain(evenTypes[action])
            .range([ 0,maxHeight*0.6]);

    // Add the lines
    var line = d3.line()
        .x(function(d) { return x(+d.time) })
        .y(function(d) { return y(d.eventType) })

    var axisXEvent=d3.axisBottom(x).tickSize(0);
    var axisYEvent=d3.axisLeft(y).tickSize(0);

    svgEvent.append("g")
        .attr("id","axisXEvent")
        .style("font","12px")
        .style("transform",`translate(${margin.left}px,${margin.top+maxHeight*0.6}px)`)
        .call(axisXEvent)
    svgEvent.select("#axisXEvent path.domain")
        .attr("marker-end","url(#arrowhead-right)");

    svgEvent.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",(margin.left+eventWidth)*.5)
        .attr("y",margin.top+maxHeight*0.6+15)
        .attr("fill","#1A1A1A")
        .text("time");  

    svgEvent.append("g")
        .attr("id","axisYEvent")
        .style("font","14px")
        .style("text-anchor","end")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`)
        .call(axisYEvent)
    // svgEvent.select("#axisYEvent path.domain")
    //     .attr("marker-start","url(#arrowhead-top)");


    svgEvent.append("text")
        .style("font-size","14px")
        .style("text-anchor","start")
        .attr("x",10)
        .attr("y",margin.top+maxHeight*0.3)
        .attr("fill","#1A1A1A")
        .text("Event Types");  


    svgEvent.append("text")
        .attr("x", margin.left)
        .attr("y", margin.top*0.6)
        .attr("text-anchor", "left")
        .style("font-size", "20px")
        .text("Events");  

    var eventWrapper=svgEvent.append("g").attr("class", "eventWrapper")
        .style("transform",`translate(${margin.left}px,${margin.top}px)`);

    for(let c=0;c<2;c++){
        eventWrapper.append("circle").attr("cx",c*80).attr("cy",maxHeight*0.6+50).attr("r", 7).style("fill", lineColor(allVideos[c]))
        eventWrapper.append("text").attr("x",c*80+15).attr("y", maxHeight*0.6+55).text(allVideos[c]).style("font-size", "15px").attr("alignment-baseline","text-top")
    }


    
    function showEvents(idx,row){
        var vd;
        for(let i=0;i<timestamps[action].length;i++){
            if (timestamps[action][i].vidx==idx){
                vd=timestamps[action][i];
                break
            }
        }

        var mousemovePoint = function(d,i) {
            var coordinates= d3.mouse(this);
            var x = coordinates[0];
            var y = coordinates[1];
            
            // D3 v4
            x = d3.event.pageX - document.getElementById(`${action}Video`).getBoundingClientRect().x + 10;
            y = d3.event.pageY - document.getElementById(`${action}Video`).getBoundingClientRect().y + 30;
    
            tooltip
                .html(`
                Video: ${vd.video} </br>
                Event: ${d.eventName} </br>
                Frame: ${d.time} </br>
                `)
                .style("left", (x+30) + "px")
                .style("top", (y+maxHeight + "px"))
                .style("opacity", 0.7)
        }

        var lines=bodyEvent.selectAll(`.myLines-${row}`)
            .data(timestamps[action],function(d){ return d; })
        
        lines.enter()
            .append("path")
            .attr("class",`myLines-${row}`)
            .attr("d", function(d){  
                if (+d.vidx==+idx) return line(d.events
                    .sort(
                    function(x,y){
                        return d3.ascending(x.time,y.time);
                    })
                    );})
            .merge(lines)
            .transition()
            .duration(1000)
            .attr("stroke", function(d){  
                return lineColor(allVideos[row]) })
            .style("stroke-width", 4)
            .style("fill", "none")
        
        lines
            .exit()
            .remove()



        var points=bodyEvent.selectAll(`.myPoints-${row}`)
                .data(vd.events,function(d){ return d; })

        points
            .enter() 
            .append("g")
            .append("circle")
            .attr("class",`myPoints-${row}`)
            .merge(points)
            .on("mouseover", mouseover)
            .on("mousemove", mousemovePoint)
            .on("mouseleave", mouseleave)
            .on("click",function(d){
                showSelectedImage([vd.video,d.time],false);
            })
            .transition()
            .duration(1000)
            .style("fill", function(d){ 
                return lineColor(allVideos[row]);})
            .attr("cx", function(d) { return x(+d.time) } )
            .attr("cy", function(d) { return y(d.eventType) } )
            .attr("r", 5)
            .attr("stroke", "white")
            .style("cursor", "pointer");

        
        points
            .exit()
            .remove();

    }


    // function resetClick() {
    //     d3.selectAll(".selected-point").style("display","none");

    //     d3.selectAll(".legendMarker")
    //         .on("mouseover", selectLegend(0.02))
    //         .on("mouseout", selectLegend(pointOpacity));

    //     body.selectAll(".point-image,.point-left,.point-right")
    //         .style("opacity", 1)
    //         .style("visibility", "visible")
    //         .style("stroke-width",  "0px")

    //     var queryImg = document.getElementById("queryImage");
    //     if (queryImg) {
    //         queryImg.style.visibility="hidden";
    //     }
    //     var referenceImg = document.getElementById("referenceImage");
    //     if (referenceImg) {
    //         referenceImg.style.visibility="hidden";
    //     }

    //     var myQuery=document.getElementById("query")
    //     var ctxQ=myQuery.getContext("2d");
    //     ctxQ.clearRect(0, 0, myQuery.width, myQuery.height);

    //     var myReference=document.getElementById("reference")
    //     var ctxR=myReference.getContext("2d");
    //     ctxR.clearRect(0, 0, myReference.width, myReference.height);

    // }
}


function showSelectedImage(idx,image=true) {
    const embs=store.scatter_dict;
    const margin={top:30,bottom:30,left:20,right:20};
    if (image){
        var frame=embs[idx];
        var ref_idx=+frame.id; // reference:st,ed
    }else{
        var video=idx[0];
        var time=idx[1];
        console.log(video);
        console.log(time);
        var frame=embs.filter(d=> d.video==video && +d.step==+time);
        if (frame){
            frame=frame[0];
        }
        var ref_idx=+frame.id;
        console.log(ref_idx);
    }

    if (frame.label==0){
        if (swingRef!="step"){
            ref_idx=+reference_idx[0][+swingRef.slice(-1)-1]+ +frame[swingRef]; //dtw1,dtw2,dtw3
        }
    }else{
        if (ballRef!="step"){
            ref_idx=+reference_idx[1][+ballRef.slice(-1)-1]+ +frame[ballRef];    
        }
    }

    var ref_frame=embs[ref_idx];

    var width=d3.select("#frame")
        .style("width")
        .slice(0,-2);

    var maxWidth=d3.min([width-margin.left-margin.right,800]);
    var maxHeight=d3.min([width*0.6,350]);

    var imgWidth=maxWidth*0.5;
    var imgHeight=maxHeight*0.7+5;

    var patchWidth=(imgWidth-5)*0.5;
    var patchHeight=imgHeight*0.5;

    var referenceImg=document.getElementById("referenceImage");
    referenceImg.width=0;
    referenceImg.height=0;

    var queryImg=document.getElementById("queryImage");
    queryImg.width=0;
    queryImg.height=0;

    // myImg.style.border="2px solid #021a40";

    var myQuery=document.getElementById("query");
    myQuery.width=imgWidth;
    myQuery.height=imgHeight+patchHeight+3;

    var myReference=document.getElementById("reference");
    myReference.width=imgWidth;
    myReference.height=imgHeight+patchHeight+3;

    var ctxQ=myQuery.getContext("2d");
    var ctxR=myReference.getContext("2d");

    function FormatNumberLength(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }

    if (frame) {        
        var query_url=extention_id+activities[+frame.label]+"_videos/rm_noise/frames/"+frame.video+FormatNumberLength(frame.step,4)+".jpg";
        var reference_url=extention_id+activities[+frame.label]+"_videos/rm_noise/frames/"+ref_frame.video+FormatNumberLength(ref_frame.step,4)+".jpg";

        // var query_url=image_url+activities[frame.seq_labels]+"/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";
        // var reference_url=image_url+activities[frame.seq_labels]+"/"+frame.names.slice(2,-1)+FormatNumberLength(frame.steps,4)+".jpg";

        queryImg.src=query_url;
        referenceImg.src=reference_url;

        var query_posi={ll:eval(frame.patchL)[0],lt:eval(frame.patchL)[1],rl:eval(frame.patchR)[0],rt:eval(frame.patchR)[1]}
        var ref_posi={ll:eval(ref_frame.patchL)[0],lt:eval(ref_frame.patchL)[1],rl:eval(ref_frame.patchR)[0],rt:eval(ref_frame.patchR)[1]}

        queryImg.onload= function() {
            ctxQ.drawImage(queryImg,0,0,1280,720,0,0,imgWidth,imgHeight);//Whole image
            ctxQ.drawImage(queryImg,query_posi.ll,query_posi.lt,500,450,0,imgHeight+3,patchWidth,patchHeight);//Left patch
            ctxQ.drawImage(queryImg,query_posi.rl,query_posi.rt,500,450,patchWidth+5,imgHeight+3,patchWidth,patchHeight);//Right patch
        }

        referenceImg.onload= function() {
            ctxR.drawImage(referenceImg,0,0,1280,720,0,0,imgWidth,imgHeight);//Whole image
            ctxR.drawImage(referenceImg,ref_posi.ll,ref_posi.lt,500,450,0,imgHeight+3,patchWidth,patchHeight);//Left patch
            ctxR.drawImage(referenceImg,ref_posi.rl,ref_posi.rt,500,450,patchWidth+5,imgHeight+3,patchWidth,patchHeight);//Right patch
        }
    }
}


function showData() {
    let scatter_embs=store.scatter_dict;
    let video_vectors=store.video_vec;
    let video_events=store.video_events;

    embsScatter(scatter_embs);
    videoHeatmap(video_vectors,video_events,"swing");
    videoHeatmap(video_vectors,video_events,"ball");

}
loadData().then(showData);
