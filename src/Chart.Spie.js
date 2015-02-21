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
		scaleShowLine : false,

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

					ctx.beginPath();

					ctx.arc(this.x, this.y, this.outerRadius, this.startAngle, this.endAngle);

					// Determine whether to color from the center of the spie, or only outside
					// the space occupied by the inner height.
					var center = this.innerRadius? this.innerRadius: this.centerRadius;
					
					ctx.arc(this.x, this.y, center, this.endAngle, this.startAngle, true);

					ctx.closePath();
					ctx.strokeStyle = this.strokeColor;
					ctx.lineWidth = this.strokeWidth;

					ctx.fillStyle = this.fillColor;

					ctx.fill();
					ctx.lineJoin = 'bevel';

					if (this.showStroke){
						ctx.stroke();
					}

					// If there is an inner heigh, draw this part of the segment...
					if (this.innerHeight){
						ctx.beginPath();

						ctx.arc(this.x, this.y, this.innerRadius, this.startAngle, this.endAngle);

						ctx.arc(this.x, this.y, this.centerRadius, this.endAngle, this.startAngle, true);

						ctx.closePath();
						ctx.strokeStyle = this.strokeColor;
						ctx.lineWidth = this.strokeWidth;

						ctx.fillStyle = this.innerFillColor;

						ctx.fill();
						ctx.lineJoin = 'bevel';

						if (this.showStroke){
							ctx.stroke();
						}
					}
				},

				// Override to highlight correct part of segment
				inRange : function(chartX,chartY){

					var pointRelativePosition = helpers.getAngleFromPoint(this, {
						x: chartX,
						y: chartY
					});

					//Check if within the range of the open/close angle
					var betweenAngles = (pointRelativePosition.angle >= this.startAngle && pointRelativePosition.angle <= this.endAngle);
					
					// The inner segment, if it exists:
					var withinInnerRadius = this.innerRadius? 
						(pointRelativePosition.distance >= this.centerRadius && pointRelativePosition.distance <= this.innerRadius): false;
					
					// The outer segment (first figure out the inner radius for this segment):
					var innerRadiusForOuterSegment = this.innerRadius? this.innerRadius: this.centerRadius;
					var withinOuterRadius = (pointRelativePosition.distance >= innerRadiusForOuterSegment && pointRelativePosition.distance <= this.outerRadius);

					// Record which (if any) is highlighted:
					this.withinInnerRadius = withinInnerRadius;
					this.withinOuterRadius = withinOuterRadius;

					return (betweenAngles && (withinInnerRadius || withinOuterRadius));
					//Ensure within the outside of the arc centre, but inside arc outer
				},
				tooltipPosition : function(){
					var innerRadiusForSegment = this.withinInnerRadius || !this.innerRadius ? this.centerRadius: this.innerRadius;
					var outerRadiusForSegment = this.withinInnerRadius? this.innerRadius: this.outerRadius;

					var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
						rangeFromCentre = (outerRadiusForSegment - innerRadiusForSegment) / 2 + innerRadiusForSegment;
					return {
						x : this.x + (Math.cos(centreAngle) * rangeFromCentre),
						y : this.y + (Math.sin(centreAngle) * rangeFromCentre)
					};
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
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];
					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
						
						if (segment.innerFillColor){
							segment.restore(["innerFillColor"]);
						}
					});
					helpers.each(activeSegments,function(activeSegment){
						// Determine whether to highlight inner or outer radius.
						if (activeSegment.withinOuterRadius){
							// It's in the outer part of the segment:
							activeSegment.fillColor = activeSegment.highlightColor;
							if (activeSegment.innerFillColor){
								activeSegment.restore(["innerFillColor"]);
							}
						} else if (activeSegment.withinInnerRadius){
							// It's in the inner part of the segment:
							activeSegment.innerFillColor = activeSegment.highlightColor;
							activeSegment.restore(["fillColor"]);

							// Temporarily set label as inner label for showTooltip call
							if (activeSegment.innerLabel){
								activeSegment.label = activeSegment.innerLabel;
							}
						}
					});
					this.showTooltip(activeSegments);

					// Reset labels back to non-inner label after showTooltip call.
					helpers.each(activeSegments,function(activeSegment){
						if (activeSegment.innerLabel){
							activeSegment.restore(["label"]);
						}
					});
				});
			}


			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				if (segment.inRange(location.x,location.y)) segmentsArray.push(segment);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex || this.segments.length;

			this.calculateTotalWidth(this.segments);

			this.segments.splice(index, 0, new this.SegmentArc({
				fillColor: segment.color,
				innerFillColor: segment.innerColor,
				highlightColor: segment.highlight || segment.color,
				label: segment.label,
				innerLabel: segment.innerLabel,
				height: segment.height,
				innerHeight: segment.innerHeight,
				width: segment.width,
				outerRadius: (this.options.animateScale) ? 0 : this.scale.calculateCenterOffset(segment.height),
				innerRadius: (this.options.animateScale) ? 0 : this.scale.calculateCenterOffset(segment.innerHeight),
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
		calculateSegmentCircumference : function(value){
			return (Math.PI*2)*(Math.abs(value) / this.totalWidth);
		},
		updateScaleRange: function(datapoints){
			var valuesArray = [];
			helpers.each(datapoints,function(segment){
				valuesArray.push(segment.height);
			});

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
					outerRadius : this.scale.calculateCenterOffset(segment.height),
					innerRadius : this.scale.calculateCenterOffset(segment.innerHeight)
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
					outerRadius : this.scale.calculateCenterOffset(segment.height),
					innerRadius : this.scale.calculateCenterOffset(segment.innerHeight)
				},easingDecimal);

				segment.endAngle = segment.startAngle + segment.circumference;

				// If we've removed the first segment we need to set the first one to
				// start at the top.
				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}

				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length - 1){
					this.segments[index+1].startAngle = segment.endAngle;
				}
				segment.draw();

			}, this);
			this.scale.draw();
		}
	});

}).call(this);