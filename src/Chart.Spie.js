(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		showScale: false,

		//Boolean - Show a backdrop to the scale label
		scaleShowLabelBackdrop : true,

		//String - The colour of the label backdrop
		scaleBackdropColor : "rgba(255,255,255,0.75)",

		// Boolean - Whether the scale should begin at zero
		scaleBeginAtZero : true,

		//Number - The backdrop padding above & below the label in pixels
		scaleBackdropPaddingY : 2,

		//Number - The backdrop padding to the side of the label in pixels
		scaleBackdropPaddingX : 2,

		//Boolean - Show line for each value in the scale
		scaleShowLine : true,

		//Boolean - Stroke a line around each segment in the chart
		segmentShowStroke : true,

		//String - The colour of the stroke on each segement.
		segmentStrokeColor : "#fff",

		//Number - The width of the stroke value in pixels
		segmentStrokeWidth : 2,

		//Number - Amount of animation steps
		animationSteps : 100,

		//String - Animation easing effect.
		animationEasing : "easeOutBounce",

		//Boolean - Whether to animate the rotation of the chart
		animateRotate : true,

		//Boolean - Whether to animate scaling the chart from the centre
		animateScale : false,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>",

		tooltipTemplate: "<%if (label){%><%=label%><%}%>"

	};


	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "Spie",
		//Providing a defaults will also register the deafults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){
			this.segments = [];
			//Declare segment class as a chart instance specific class, so it can share props for this instance
			
			this.SliceArc = Chart.Arc.extend({
				x : this.chart.width/2,
				y : this.chart.height/2,

				// Override to highlight correct part of segment
				inRange : function(chartX,chartY){

					var pointRelativePosition = helpers.getAngleFromPoint(this, {
						x: chartX,
						y: chartY
					});

					//Check if within the range of the open/close angle
					var betweenAngles = (pointRelativePosition.angle >= this.startAngle && pointRelativePosition.angle <= this.endAngle);
					
					var withinSlice = (pointRelativePosition.distance >= this.innerRadius && pointRelativePosition.distance <= this.outerRadius);

					console.log("within " + this.label + "?: " + betweenAngles + ", " + withinSlice);
					return (betweenAngles && withinSlice);
					//Ensure within the outside of the arc centre, but inside arc outer
				},
				tooltipPosition : function(){
					var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
						rangeFromCentre = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
					return {
						x : this.x + (Math.cos(centreAngle) * rangeFromCentre),
						y : this.y + (Math.sin(centreAngle) * rangeFromCentre)
					};
				}
			});

			this.SegmentArc = Chart.Arc.extend({
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				ctx : this.chart.ctx,
				centerRadius : 0,
				x : this.chart.width/2,
				y : this.chart.height/2,
				
				// Extend to allow for two separate parts to the segment, inner & outer.
				draw : function(animationPercent){

					var easingDecimal = animationPercent || 1;

					var ctx = this.ctx;

					helpers.each(this.slices, function(slice){
					
						ctx.beginPath();

						ctx.arc(this.x, this.y, slice.outerRadius, this.startAngle, this.endAngle);

						ctx.arc(this.x, this.y, slice.innerRadius, this.endAngle, this.startAngle, true);

						ctx.closePath();
						ctx.strokeStyle = this.strokeColor;
						ctx.lineWidth = this.strokeWidth;

						ctx.fillStyle = slice.fillColor? slice.fillColor: this.fillColor;

						ctx.fill();
						ctx.lineJoin = 'bevel';

						if (this.showStroke){
							ctx.stroke();
						}
					}, this);
				}
			});
			this.scale = new Chart.RadialScale({
				display: this.options.showScale,
				fontStyle: this.options.scaleFontStyle,
				fontSize: this.options.scaleFontSize,
				fontFamily: this.options.scaleFontFamily,
				fontColor: this.options.scaleFontColor,
				showLabels: this.options.scaleShowLabels,
				showLabelBackdrop: this.options.scaleShowLabelBackdrop,
				backdropColor: this.options.scaleBackdropColor,
				backdropPaddingY : this.options.scaleBackdropPaddingY,
				backdropPaddingX: this.options.scaleBackdropPaddingX,
				lineWidth: (this.options.scaleShowLine) ? this.options.scaleLineWidth : 0,
				lineColor: this.options.scaleLineColor,
				lineArc: true,
				width: this.chart.width,
				height: this.chart.height,
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2,
				ctx : this.chart.ctx,
				templateString: this.options.scaleLabel,
				valuesCount: data.length
			});

			this.updateScaleRange(data);

			this.scale.update();

			helpers.each(data,function(segment,index){
				this.addData(segment,index,true);
			},this);

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSlices = (evt.type !== 'mouseout') ? this.getSlicesAtEvent(evt) : [];
					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
						helpers.each(segment.slices,function(slice){
							slice.restore(["fillColor"]);
						});
					});
					helpers.each(activeSlices,function(activeSlice){
						activeSlice.fillColor = activeSlice.highlightColor;
					});
					this.showTooltip(activeSlices);
				});
			}


			this.render();
		},
		getSlicesAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				helpers.each(segment.slices, function(slice){
					slice.x = segment.x;
					slice.y = segment.y;
					if (slice.inRange(location.x,location.y)) segmentsArray.push(slice);
				}, this);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex || this.segments.length;

			this.calculateTotalWidth(this.segments);

			var slices = [];

			helpers.each(segment.slices, function(slice){
				slices.splice(0, 0, new this.SliceArc({
					height: slice.height,
					fillColor: slice.color,
					highlightColor: slice.highlight,
					label: (segment.label? segment.label: "") + 
						(slice.label? slice.label: ""),
					startAngle: Math.PI * 1.5
				}));
			}, this);

			this.segments.splice(index, 0, new this.SegmentArc({
				fillColor: segment.color,
				highlightColor: segment.highlight || segment.color,
				height: this.getSegmentHeight(segment.slices),
				innerHeight: segment.innerHeight,
				width: segment.width,
				slices: slices,
				outerRadius: (this.options.animateScale) ? 0 : this.scale.calculateCenterOffset(this.getSegmentHeight(segment.slices)),
				circumference: (this.options.animateRotate) ? 0 : this.calculateSegmentCircumference(segment.width),
				startAngle: Math.PI * 1.5
			}));

			if (!silent){
				this.reflow();
				this.update();
			}
		},
		removeData: function(atIndex){
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length-1;
			this.segments.splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},
		calculateTotalWidth : function(data){
			this.totalWidth = 0;
			helpers.each(data,function(segment){
				this.totalWidth += Math.abs(segment.width);
			},this);
		},
		calculateTotalHeight: function(data){
			this.totalHeight = 0;
			helpers.each(data,function(segment){
				this.totalHeight += segment.height;
			},this);
			this.scale.valuesCount = this.segments.length;
		},
		getSegmentHeight: function(data){
			var segmentHeight = 0;
			
			helpers.each(data,function(slice){
				segmentHeight += slice.height;
			},this);

			return segmentHeight;
		},
		calculateSegmentCircumference : function(value){
			return (Math.PI*2)*(Math.abs(value) / this.totalWidth);
		},
		updateScaleRange: function(datapoints){
			var valuesArray = [];
			helpers.each(datapoints,function(segment){
				valuesArray.push(this.getSegmentHeight(segment.slices));
			}, this);

			var scaleSizes = (this.options.scaleOverride) ?
				{
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				} :
				helpers.calculateScaleRange(
					valuesArray,
					helpers.min([this.chart.width, this.chart.height])/2,
					this.options.scaleFontSize,
					this.options.scaleBeginAtZero,
					this.options.scaleIntegersOnly
				);

			helpers.extend(
				this.scale,
				scaleSizes,
				{
					size: helpers.min([this.chart.width, this.chart.height]),
					xCenter: this.chart.width/2,
					yCenter: this.chart.height/2
				}
			);

		},
		update : function(){
			this.calculateTotalHeight(this.segments);
			this.calculateTotalWidth(this.segments);

			helpers.each(this.segments,function(segment){
				segment.save();
			});
			
			this.reflow();
			this.render();
		},
		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.updateScaleRange(this.segments);
			this.scale.update();

			helpers.extend(this.scale,{
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2
			});

			helpers.each(this.segments, function(segment){
				segment.update({
					outerRadius : this.scale.calculateCenterOffset(segment.height)
				});
			}, this);

		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			//Clear & draw the canvas
			this.clear();

			this.calculateTotalWidth(this.segments);

			helpers.each(this.segments,function(segment, index){
				
				segment.transition({
					circumference : this.calculateSegmentCircumference(segment.width),
					outerRadius : this.scale.calculateCenterOffset(segment.height)
				},easingDecimal);

				// Add inner and outer radius + height to slices.
				var sliceHeight = 0;
				helpers.each(segment.slices, function(slice){
					
					slice.innerRadius = this.scale.calculateCenterOffset(sliceHeight);
					
					sliceHeight += slice.height;
					slice.heightInSegment = sliceHeight;
					
					slice.outerRadius = this.scale.calculateCenterOffset(slice.heightInSegment);
					
				}, this);

				segment.endAngle = segment.startAngle + segment.circumference;

				helpers.each(segment.slices, function(slice){
					slice.endAngle = segment.endAngle;
				}, this);

				// If we've removed the first segment we need to set the first one to
				// start at the top.
				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}

				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length - 1){
					this.segments[index+1].startAngle = segment.endAngle;

					helpers.each(this.segments[index+1].slices, function(slice){
						slice.startAngle = segment.endAngle;
					}, this);
				}
				segment.draw();

			}, this);
			this.scale.draw();
		}
	});

}).call(this);