/*global $*/
/**
 * Copyright (c) 2015 Fitch Learning
 *
 * @author Chris Cunningham (www.phpws.uk)
 * @date 2015-10-19
 */
(function() {

    "use strict";

    /**
     * Object global vars
     */
    var root = this;

    /** @type {*|Function|Chart|previous} */
    var Chart = root.Chart;

    /** @type {Object} Cache a local reference to Chart.helpers. */
    var helpers = Chart.helpers;

    /** Canvas vars. */
    var canvas;
    var context;
    var centerX;
    var centerY;
    var radius;
    var newBoxWidth;
    var newBoxHeight;

    /**
     * @type {Object} - defaultConfig for the Spie Chart, these properties are defined within the Chart.js and Chart.Spie
     * files, and here they are being set to default values that are required for Fitch's spie chart.
     */
    var defaultConfig = {

        /** @type {Number} - Modify the scale of the chart with in the canvas with out changing the canvas size. */
        scale: 0.815,

        /** Boolean - Always disable Chart.js showTooltips as it is buggy, use showCustomTooltips instead. */
        showTooltips: false,

        /** @type {Boolean} - Draw parent tooltips on the canvas or not - attaches events to touchmove & mousemove */
        showCustomTooltips: true,

        /** @type {Boolean} - Stroke a line around each segment in the chart */
        segmentShowStroke: true,

        /** @type {String} - The colour of the stroke on each segment. */
        segmentStrokeColor: '#eeeeee',

        /** @type {Number} - Starting font size, will auto scale in a responsive element using percentage for width. */
        chartFontSize: 14,

        /** @type {Number} - The the line width of the clock arms in pixels. */
        clockArmLineWidth: this.THIN_LINE_WIDTH,

        /** @type {String} - The colour to use for the clock arm colour, can be a css hex colour e.g. #ccc */
        clockArmColour: '#797979',

        /** @type {String} - The font to use for the text around the pie chart. */
        clockTextFont: "'Arial'",

        /** @type {String} - The colour of the text around the pie chart. */
        clockTextColour: 'black',

        /** @type {Number} - Percentage amount of padding from the radius to add to text drawn around the pie chart.*/
        clockTextPaddingXAxis: 3,

        /** @type {Number} - Percentage amount of padding from the radius to add to text drawn inside the pie chart */
        clockInnerTextPaddingXAxis: 3,

        /** @type {Number} - The amount of degrees to rotate the text drawn around the clock face. */
        clockTextRotation: 0,

        /** @type {String} - The hex ccs colour for the font in the text box. */
        clockTextBoxFontColour: '#fff',

        /** @type {String} - The hex ccs colour for the box background colour. */
        clockTextBoxFillColour: "#000",

        /** @type {Boolean} - True if the text should be flipped when reaching past 50% of the clock face */
        clockTextFlip: true,

        /** @type {String|Number} - CSS font weight value can be string or number. */
        clockTextWeight: 'normal',

        /** @type {Number} - The ratio between date text size and the charts default text size. */
        dateTextRatio: 0.75,

        /** @type {Boolean} - Set to true if the browser is IE7 or IE8, used to turn off features not support by IE. */
        isLessThanIE9: false,

        /** @type {Boolean} - Set to true if the browser is IE */
        isIE: false,

        /** @type {Number} - The amount of curve to add to text box corners. */
        clockTextBoxRoundedCorner: 6,

        /** @type {Array} - The events to use for ajax requests to load stats data. */
        actionEvents: ['click', 'touchend'],

        /** @type {String} - The name of the container element for detail topic stats */
        containerId: '',

        /** @type {String} - The name of the template element to build detailed topic stats */
        templateId: '',

        /**
         * This will be set to true if the NodeStats feature value is set to == 'ajax', this means that all the charts
         * data will load using ajax requests instead of from page load.
         *
         * @type {Boolean}
         */
        useAjax: false
    };

    /**
     * @class Fitch
     *
     * @extends Spie
     *
     * Note: IE<9 doesn't support the const keyword so constants are defined as this.CAPITAL_LETTER_NAME
     */
    Chart.types.Spie.extend({

        /** @constant {Number} - Used when text should be aligned with the circumference of the pie chart. */
        TEXT_ALIGN_ALONG_CIRCUMFERENCE: 90,

        /** @constant {Number} - Used when text to be aligned at a right angle from the circumference of the pie chart. */
        TEXT_ALIGN_RIGHT_ANGLE_FROM_CIRCUMFERENCE: 0,

        /**
         * @constant {Number} - Percentage position for black text boxes 100% aligns to the circumference, Over 100% moves
         * the boxes further away from the circumference.
         */
        TEXT_BOX_POSITION_FROM_CIRCUMFERENCE: 120,

        /** @constant {number} - The clock arm length in percentage relative to radius. Over 100% extends the arm. */
        OUTSIDE_CHART_LINE_LENGTH: 130,

        /** @constant {number} - Specific amount of padding for black box around pie chart. */
        PADDING_OF_PIE_CHART_OUTSIDE_TEXT_BOX: 9,

        /** @constant {number} - Font size that is used for the the start and end black box around the chart. */
        FONT_SIZE_START_AND_END_BOXES: 11,

        /** @constant {number} - Specific amount of padding for the toll tip pop up box when hovering over a slice. */
        TOOL_TIP_TEST_PADDING: 8,

        /** @constant {Number} - Const to define line thickness for clock arms drawn on the pie chart. */
        THIN_LINE_WIDTH: 1,

        /** @constant {Number} - Const to define line thickness for clock arms drawn on the pie chart. */
        THICK_LINE_WIDTH: 3,

        /** @constant {Number} - The height of a selected slice. */
        SELECTED_SLICE_HEIGHT: 112,

        /** @constant {Number} - The height of a normal slice. */
        NORMAL_SLICE_HEIGHT: 100,

        /** @constant {String} - Config setting which defines if a segments slice should be line filled. */
        FILL_SHAPE_DIAGONAL_WITH_LINES: 'lines',

        /** @constant {String} - Tag from data set to identify the current clock position. */
        CLOCK_ARM_TAG: 'today',

        /** @constant {String} - Tag from data set to identify the end date position. */
        END_TAG: 'end',

        /** @constant {String} - Tag from data set to identify the start date position. */
        START_TAG: 'start',

        /** @constant {Number} - Multiplier to adjust the rotation of line fill diagonal lines. */
        LINE_FILL_ROTATION: 0,

        /** @constant {Number} - Transparency setting for tool tip box. */
        TOOL_TIP_BOX_TRANSPARENCY: 0.7,

        /** @constant {Number} - The product portal node label for hurdle tests. */
        LABEL_HURDLE_TEST: 'hurdle test',

        /**
         * @constant {Boolean} - Set to false to only show "completed x%" message when hovering over slice, set to true
         *                       to show message "completed %x" and "incompleted x%" message.
         */
        USE_TOOL_TIP_INCOMPLETE_MESSAGE: false,

        /**
         * @constant {Number}
         *
         * This is used to work out a new scale size for the chart when scaling the chart with browser zoom. A start
         * canvas size of 500px x 500px positions everything correctly so everything must be adjusted based on the
         * ratio between the original canvas size and the new size from the zoom and the original size the chart was
         * designed for.
         */
        SCALE_RATIO_DENOMINATOR: 500,

        /** @type {String} - Passing in a name registers this chart in the Chart namespace in the same way. */
        name: "Fitch",

        /** @type {Object} - Providing a defaults will also register the defaults in the chart namespace. */
        defaults: defaultConfig,

        /** @type {Number} - The start date taken from the data, using the unixTime field. */
        startDate: 0,

        /** @type {Number} - The end date taken from the data, using the unixTime field. */
        endDate: 0,

        /** @type {Number} - The amount of seconds from the start date to the end date. */
        dateRange: 0,

        /** @type {Number} - The unix time stamp of today's date. */
        nowUnixTimeStamp: 0,

        /** @type {Number|Boolean} - The clock arm position in percentage, calculated from todays date. */
        clockArmPosition: false,

        /** @type {Object} - The segment that relates to todays date. */
        todaySegment: {},

        /** @type {Object} - The last segment in the this.segments array. */
        lastSegment: {},

        /** @type {Array} - List of all segments to display in the Spie chart. */
        segments: [],

        /** @type {Object} - Holds information about urls like ajax requests such as the url to get stats data from */
        urls: {},

        /** @type {Array} - This holds all the initial data from the onload ajax request made in ChartManager.js */
        data: [],

        /** @type {Object} - This holds all the node stats data for loading different data when a slice is clicked. */
        nodeStats: {},

        /**
         * {Array{}} - Array of objects - list of element hit points with mapping to a hit point id, this is required for older browsers.
         *        otherwise I could have just used context.addHitRegion()
         */
        hitPointMap: [],

        /**
         * @function initialize
         *
         * Initialize is fired when the chart is initialized - Data is passed in as a parameter
         * config is automatically merged by the core of Chart.js, and is available at this.options
         *
         * @param {Object} inputData - Array of inputData objects with all the info required to build the Spie Chart.
         */
        initialize: function (inputData) {

            this.setBrowserOptions();
            this.parseInputParameters(inputData);
            this.dataDoctor(this.data);
            this.parseDates(this.data);
            this.parseWidthAndHeights(this.data);
            this.extendSegmentArc();
            this.addDataViewMap();

            this.options.onAnimationComplete = this.prepareChart;

            Chart.types.Spie.prototype.initialize.apply(this, [this.data]);

            this.options.onToolTipRedraw = this.drawChart;

            this.addMouseOverEvents();
        },

        /**
         * Function to add onclick events to slices or hitPointMap elements, when a slice is clicked this will update
         * all the html elements to display new information about a topic slice. Or if a hitPointMap is hit then the
         * mapped anonymous function will be executed.
         */
        addOnclickEvents: function () {

            helpers.bindEvents(this, this.options.actionEvents, function (event) {

                if (this.handleHitPoint(event)) {
                    return;
                }

                var segment = (event.type !== 'mouseout') ? this.getSegmentAtSliceEvent(event).segment : [];

                var main = $(this.options.containerId);

                if (this.validateClick(segment) === false) {
                    return;
                }

                $(this.options.templateId).remove();

                if (this.options.useAjax === true) {
                    var url = this.urls.node_stats + [].concat.apply([], [segment.ancestorId, segment.childIds]).join('/') + '/';
                    $.ajax({
                        url: url
                    }).success(function (responseData) {
                        this.parseViewParameters(responseData, main);
                    }.bind(this));
                } else {
                    var nodeStatsData = this.getNodeStatsFromParentChildIds(segment.ancestorId, segment.childIds);
                    this.parseViewParameters(nodeStatsData, main);
                }

            }.bind(this));
        },

        /**
         * @param {Object} event
         * @returns {boolean}
         */
        handleHitPoint: function(event) {

            if (this.options.isIE) {
                return false; // Don't do this for IE it doesn't handle it very well.
            }

            var location = helpers.getRelativePosition(event);

            var hitPointEvent = this.getHitPointEvent(location.x, location.y);

            if (!hitPointEvent) {
                return false;
            }

            return hitPointEvent.event(event, hitPointEvent);
        },

        /**
         * @param {Number} x
         * @param {Number} y
         * @returns {*}
         */
        getHitPointEvent: function(x, y) {

            x = parseInt(x);
            y = parseInt(y);

            for (var i = 0; i < this.hitPointMap.length; i++) {
                var hitPoint = this.hitPointMap[i];
                if (Object.prototype.hasOwnProperty.call(hitPoint.map, x)) {
                    var yRange = hitPoint.map[x];
                    if (y >= yRange[0] && y <= yRange[1]) {
                        return hitPoint;
                    }
                }
            }
            return false;
        },

        /**
         * @param {Object} nodeStatsData
         * @param {Array} main
         */
        parseViewParameters: function (nodeStatsData, main) {
            $.each(nodeStatsData, function (key, value) {
                if (key !== 'nodes') {
                    this.parseViewParam(main, key, value, nodeStatsData);
                } else {
                    this.parseNodeStats(main, key, value);
                }
            }.bind(this));
        },

        /**
         * @param {Object} segment - The segment to check against to see if it is the same segment as the clicked one.
         *
         * @returns {boolean}
         */
        validateClick: function (segment) {
            if (!segment) {
                return false;
            }
            var returnState = true;
            helpers.each(this.segments, function (currentSegment) {
                if (returnState) {
                    // Just return as we have already found a matching segment if we are at this line of code.
                    return false;
                }
                if (this.isSameSegment(segment, currentSegment) && segment.isSelected === true) {
                    returnState = false;
                    return false;
                }
            }, this);
            return returnState;
        },

        /**
         * @param {Number} parentNodeId
         * @param {Array} childIds
         */
        getNodeStatsFromParentChildIds: function (parentNodeId, childIds) {

            var matchedNodeStat = false;

            helpers.each(this.nodeStats.nodes, function (nodeStat) {

                if (matchedNodeStat !== false) {
                    return;
                }

                if (nodeStat.parentId !== parentNodeId) {
                    return false;
                }

                var nodeStatChildIds = [];

                $(nodeStat.nodes).each(function (index, childDataSet) {
                    $(childDataSet).each(function (index, childNode) {
                        if (childNode.label !== this.LABEL_HURDLE_TEST) {
                            nodeStatChildIds.push(childNode.nodeId);
                        }
                    }.bind(this));
                }.bind(this));

                nodeStatChildIds.sort();
                childIds.sort();

                if (JSON.stringify(nodeStatChildIds) === JSON.stringify(childIds)) {
                    matchedNodeStat = nodeStat;
                    return true;
                }

            }.bind(this));

            return matchedNodeStat;
        },

        /**
         * @param {Object} main - jQuery element object
         * @param {String} key
         * @param {Array} nodes
         */
        parseNodeStats: function (main, key, nodes) {

            if (typeof nodes !== 'object') {
                return;
            }

            var templates = [];
            var template = {};

            for (var i = (nodes.length - 1); i > -1; i--) {

                template = $('#stats-section-template').clone();

                template.addClass('node-stats-section');
                template.removeClass('hide');
                template.removeAttr('id');

                var nodeSet = nodes[i];

                this.buildNodeSet(nodeSet, template);

                templates.unshift(template);
            }

            $.map(templates, function (template) {
                template.appendTo(main);
            });
        },

        /**
         * @param {Number} listSize
         * @param {Object} element - jQuery element object
         * @param {String} elementClassName
         */
        removeListOfClasses: function (listSize, element, elementClassName) {
            $.map(new Array(listSize), function (x, index) {
                element.removeClass(elementClassName + index);
            });
        },

        /**
         * @param {Array} template - jQuery html element
         * @param {String} key
         * @param {String} value
         * @param {Object} nodeStatsData
         */
        parseViewParam: function (template, key, value, nodeStatsData) {
            $.each(this.dataViewMapping, function (viewParamName, dataParamName) {

                if (typeof dataParamName === 'object' && Object.prototype.hasOwnProperty.call(dataParamName, key)) {
                    if (typeof dataParamName[key] === 'function') {
                        dataParamName[key](template, viewParamName, value, nodeStatsData);
                    } else {
                        key = dataParamName;
                    }
                }

                if (dataParamName === key) {
                    this.updateElement(template, viewParamName, value);
                }

            }.bind(this));
        },

        /**
         *
         * @param {Array} template - jQuery html element
         * @param {String} viewParamName
         * @param {String} value
         */
        updateElement: function (template, viewParamName, value) {
            var element = $('.' + viewParamName, template);
            if (typeof element !== 'undefined') {
                element.html(value);
            }
        },

        /**
         * @param {Object} inputData
         *
         * @param {Array} inputData.data
         * @param {Object} inputData.nodeStats
         *
         * @param {String} inputData.nodeStats.contentNodeUrl
         * @param {String} inputData.nodeStats.parentContentUrl
         * @param {String} inputData.nodeStats.parentStatus
         *
         * @param {Object[]} inputData.nodeStats.nodes
         * @param {String} inputData.nodeStats.nodes.parentStatusText
         * @param {Number} inputData.nodeStats.nodes.parentId
         * @param {Number} inputData.nodeStats.nodes.parentMenuId
         * @param {String} inputData.nodeStats.nodes.parentName
         * @param {Number} inputData.nodeStats.nodes.parentAverage
         * @param {String} inputData.nodeStats.nodes.parentDueDate
         * @param {Boolean} inputData.nodes.nodeStats.isAjax
         *
         * @param {Array}  inputData.urls
         * @param {String} inputData.urls.node_stats
         * @param {String} inputData.urls.my_study_plan
         */
        parseInputParameters: function (inputData) {
            this.data = inputData.data;
            this.nodeStats = inputData.nodeStats;
            this.urls = inputData.urls;
            this.options.useAjax = typeof inputData.nodeStats.isAjax !== 'undefined';
        },

        /**
         * Configure the chart based on browser type.
         */
        setBrowserOptions: function () {

            // @see http://goo.gl/x4jcS for an explanation of these feature detections.

            var isIE = !!document.documentMode;
            var isEdge = !isIE && !!window.StyleMedia;

            this.options.isIE = $('html').is('.ie7') || isIE || isEdge;
            this.options.isLessThanIE9 = !this.isCanvasSupported();
            this.options.animationSteps = this.isCanvasSupported() ? 60 : 1;
        },

        /**
         * Fix any data that could break pie chart layout.
         *
         * @param {Object[]} data - See function: this.initialize() for data object description.
         */
        dataDoctor: function (data) {
            data.unshift({
                "label": "",
                "date": "",
                "fullDate": "",
                "unixTime": data[0].unixTime,
                "enableDrawDate": false,
                "width": 0,
                "percentage": 0,
                "isTest": false,
                "slices": [{"height": 100}]
            });
        },

        /**
         * @function parseDates
         *
         * @param {Array[]} data - See function: this.initialize() for data object description.
         */
        parseDates: function (data) {

            this.todaySegment.unixTime = 0;

            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

            this.nowUnixTimeStamp = Math.floor(today.getTime() / 1000);

            if (isNaN(this.nowUnixTimeStamp)) {
                this.nowUnixTimeStamp = 0;
            }

            helpers.each(data, function (segment) {

                // Add the unix time with the unix time from the client browser don't use server side unix time's
                // as this will not work, mixing the clients browser unix time and server unix time will have
                // unexpected results when trying to calculate the clock arms offset positions.
                segment.unixTime = (new Date(segment.fullDate)).getTime() / 1000;

                if (this.startDate === 0 || segment.unixTime < this.startDate) {
                    this.startDate = segment.unixTime; // Set the start date
                }
                if (this.endDate === 0 || segment.unixTime > this.endDate) {
                    this.endDate = segment.unixTime; // Find the end date
                }
                if (segment.unixTime <= this.nowUnixTimeStamp && segment.unixTime >= this.todaySegment.unixTime) {
                    this.todaySegment = segment; // Today's segment slice
                }
            }, this);

            if (this.nowUnixTimeStamp < this.startDate || this.nowUnixTimeStamp > this.endDate) {
                return; // Nothing to do, the course hasn't started yet or has finished.
            }

            var totalWidth = 0;

            /**
             * Now dynamically off set the clock arm position to represent todays date on the clock face.
             * As slices vary in width and the start and end date can be anything from 1 day to 30 days, treat each
             * slice as by its own date range and position the clock arm with in that slices date range.
             */
            for (var i = 0; i < data.length; i++) {
                var segment = data[i];

                totalWidth += segment.width;

                if (typeof segment.ancestorId === 'undefined' || typeof segment.childIds === 'undefined') {
                    continue;
                }

                var nextSegment = typeof data[i + 1] !== 'undefined' ? data[i + 1] : false;

                if (!nextSegment) {
                    break;
                }

                if (this.isSameSegment(segment, this.todaySegment)) {
                    var currentSegment = {};
                    if (nextSegment.date === segment.date) {
                        // Try to handle bad config when two topics have the same start date.
                        totalWidth += nextSegment.width;
                        currentSegment = nextSegment;
                        nextSegment = typeof data[i + 2] !== 'undefined' ? data[i + 2] : false;

                        // If no next segment just turn the clock arm off as this is not possible to handle.
                        if (!nextSegment) {
                            this.clockArmPosition = 0;
                            break;
                        }
                    } else {
                        currentSegment = segment;
                    }

                    var startRange = totalWidth - currentSegment.width;
                    var dateWidth = nextSegment.unixTime - currentSegment.unixTime;
                    var datePositionWidth = this.nowUnixTimeStamp - currentSegment.unixTime;

                    this.clockArmPosition = (datePositionWidth / dateWidth) * currentSegment.width + startRange;
                }
            }
        },

        isSameSegment: function (segmentA, segmentB) {
            return segmentA.ancestorId === segmentB.ancestorId &&
                JSON.stringify(segmentA.childIds) === JSON.stringify(segmentB.childIds);
        },

        /**
         * @param data
         */
        parseWidthAndHeights: function (data) {
            var foundSelected = false;

            for (var i = 0; i < data.length; i++) {

                var currentSegment = data[i];

                if (typeof currentSegment.isSelected === 'boolean' && currentSegment.isSelected === true) {
                    this.applySelectedHeights(currentSegment);
                    foundSelected = true;
                }

                if ((data.length - 1) === i) { // last element.
                    if (!foundSelected) {
                        // Default to select first segment if nothing found.
                        data[1].isSelected = true;
                        // Note: data should contain an invisible start element at index 0 to work around a bug.
                        // It's a disappointing solution, but this chart lib is to massive to debug, I may come back to
                        // it if I have time at the end. The entire pie chart brakes with out it at the moment.
                        // see: this.dataDoctor();
                        this.applySelectedHeights(data[1]);
                    }
                }

                // 0.0001 is Work around for a IE7-8 bug there has to be some width setting otherwise it has a fit.
                if (currentSegment.width === 0) {
                    var ieWorkAround = 0.0001;
                    currentSegment.width = ieWorkAround;
                    if (typeof data[i + 1] !== 'undefined') {
                        data[i + 1].width = data[i + 1].width - ieWorkAround;
                    } else if (typeof data[i - 1] !== 'undefined') {
                        data[i - 1].width = data[i - 1].width - ieWorkAround;
                    }
                }
            }

            // Calculate this after the for loop due to the IE bug adjustments.
            // Note: this.totalWidth needs to be calculated for the Chart.Spie lib to work
            // see: Chart.Spie function called calculateSegmentCircumference()
            this.totalWidth = 0;
            helpers.each(data, function (segment) {
                this.totalWidth += segment.width;
            }, this);
        },

        /**
         * @param {Number} percentageWidth
         * @returns {number}
         */
        percentageToDegrees: function (percentageWidth) {
            return 360 * (percentageWidth / 100);
        },

        /**
         * Extend the chart arc class so that each segment in this.segments has this new method attached to it.
         *
         * @augments Chart.Arc
         */
        extendSegmentArc: function () {

            this.SegmentArc = Chart.Arc.extend({

                /**
                 * Draw diagonal line fills on top of a segments normal colour fill.
                 */
                drawLineFills: function (size, FitchChart) {

                    var ctx = this.ctx;

                    helpers.each(this.slices, function (slice) {

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, slice.outerRadius, this.startAngle, this.endAngle);
                        ctx.arc(this.x, this.y, slice.innerRadius, this.endAngle, this.startAngle, true);
                        ctx.closePath();

                        var canvasPattern = document.createElement('canvas');

                        var newScaledSize = FitchChart.scaleForBrowserZoom(size, 5);

                        canvasPattern.width = newScaledSize;
                        canvasPattern.height = newScaledSize;

                        var ctxPattern = {};

                        try {
                            ctxPattern = canvasPattern.getContext('2d');
                        } catch (e) {
                            // IE7-8 can't handle line fill.
                            return;
                        }

                        ctxPattern.beginPath();
                        ctxPattern.lineWidth = FitchChart.scaleForBrowserZoom(size, 0.25);
                        ctxPattern.moveTo(0, newScaledSize);
                        ctxPattern.lineTo(newScaledSize, 0);
                        ctxPattern.stroke();

                        ctx.fillStyle = ctx.createPattern(canvasPattern, "repeat");

                        var newScaledTranslate = FitchChart.scaleForBrowserZoom(size, centerX);

                        ctx.translate(newScaledTranslate, newScaledTranslate);
                        ctx.rotate(FitchChart.LINE_FILL_ROTATION * (Math.PI / 180));
                        ctx.fill();
                        ctx.lineJoin = 'bevel';
                        ctx.restore();

                    }, this);
                }
            });
        },

        /**
         * Transform any number by the scale ratio denominator, this is use for re scaling elements of the chart
         * base on the zoom level of the browser window.
         *
         * @param {Number} size
         * @param {Number} number
         */
        scaleForBrowserZoom: function(size, number) {
            var scaleRatio = size / this.SCALE_RATIO_DENOMINATOR;
            return number * scaleRatio;
        },

        /**
         * Prepare the chart so it is ready to be draw once the main spie chart has finished being animated.
         */
        prepareChart: function () {
            canvas = this.chart.canvas;
            context = canvas.getContext('2d');

            newBoxWidth = newBoxHeight = radius = this.segments[0].slices.slice(-1)[0].outerRadius;

            centerX = this.scale.xCenter;
            centerY = this.scale.yCenter;

            this.addBindEvents();
            this.drawChart();

            this.options.onAnimationComplete = function () {}; // Reset only do this when the page is first loaded.
        },

        /**
         * Draw the chart in order procedural order of layers.
         */
        drawChart: function () {
            this.drawBeforeClockArms();
            this.clockArmsWithText(this.addClockArms());
            this.drawAfterClockArms();
        },

        /**
         * Items that should be draw on the canvas before the clock arms, separated into separate function for use
         * with before and after events of animations.
         */
        drawBeforeClockArms: function () {
            this.fillShapes();
        },

        /**
         * Items that should be drawn on the canvas after the clock arms, separated into separate function for use
         * with before and after events of animations.
         */
        drawAfterClockArms: function () {
            this.drawSegmentData();
            this.clockArmsWithText(this.addStartEndTextBoxes());
            this.centerDot(1.3);
        },

        /**
         * Set up tooltip events on the chart
         */
        addMouseOverEvents: function () {

            if (this.options.showCustomTooltips && !this.options.isLessThanIE9) {
                helpers.bindEvents(this, this.options.tooltipEvents, function (evt) {

                    var segmentData = (evt.type !== 'mouseout') ? this.getSegmentAtSliceEvent(evt) : [];

                    helpers.each(this.segments, function (segment) {
                        segment.restore(["fillColor"]);
                        helpers.each(segment.slices, function (slice) {
                            slice.restore(["fillColor"]);
                        });
                    });

                    helpers.each(segmentData, function (activeSlice) {
                        if (activeSlice !== false && typeof activeSlice.highlightColor !== 'undefined') {
                            activeSlice.fillColor = activeSlice.highlightColor;
                        }
                    });

                    this.clear();
                    this.draw();
                    this.drawChart();

                    if (typeof segmentData.segment !== 'undefined' && typeof segmentData.segment.label !== 'undefined') {
                        this.clockArmsWithText(this.addToolTip(segmentData));
                    }

                    this.handleMouseOver(evt, segmentData);
                });
            }
        },

        /**
         * Change the mouse pointer from the arrow to a hand pointer if the mouse is over click able content.
         *
         * @param {object} event
         * @param {object} segmentData
         * @returns {boolean}
         */
        handleMouseOver: function(event, segmentData) {

            if (typeof segmentData.segment !== 'undefined' && typeof segmentData.segment.label !== 'undefined') {
                event.target.style.cursor = 'pointer';
                return true;
            }

            var location = helpers.getRelativePosition(event);

            var hitPointEvent = this.getHitPointEvent(location.x, location.y);

            if (!hitPointEvent && typeof canvas !== 'undefined') {
                canvas.style.cursor = 'auto';
                return false;
            }

            event.target.style.cursor = 'pointer';
            return true;
        },

        /**
         * @param {Object} segmentData
         * @returns {Array}
         */
        addToolTip: function (segmentData) {
            var data = [];

            var slices = segmentData.segment.slices;

            var text = segmentData.slice.segmentLabel;
            var location = segmentData.location;

            if(!this.USE_TOOL_TIP_INCOMPLETE_MESSAGE && slices[0].height !== 0) {
                // Only use the completed slice to display the tool tip location
                // and label if USE_TOOL_TIP_INCOMPLETE_MESSAGE == false
                text = slices[0].segmentLabel;
                location = segmentData.locationA;
            }

            this.addClockFaceData(data, {
                percentage: segmentData.segment.percentage,
                text: text,
                clockArmLineWidth: 0,
                clockDrawTextBox: true,
                clockTextPaddingXAxis: 0,
                clockTextBoxPadding: this.TOOL_TIP_TEST_PADDING,
                clockTextFlip: false,
                clockTextRotation: false,
                clockTextWeight: 'normal',
                clockTextBoxTipAlign: 'center',
                clockTextBoxUseUppercase: false,
                location: location,
                clockTextBoxFillAlpha: this.TOOL_TIP_BOX_TRANSPARENCY,
                clockTextBoxRoundedCorner: this.options.clockTextBoxRoundedCorner
            });
            return data;
        },

        /**
         * @function getSlicesAtEvent
         *
         * @class Chart
         *
         * @param e
         * @returns {Object}
         */
        getSegmentAtSliceEvent: function (e) {
            var foundSegment = false, foundSlice = false;

            var location = helpers.getRelativePosition(e);

            helpers.each(this.segments, function (segment) {
                if (foundSegment) {
                    return true;
                }
                helpers.each(segment.slices, function (slice) {
                    slice.x = segment.x;
                    slice.y = segment.y;
                    if (slice.inRange(location.x, location.y)) {
                        foundSegment = segment;
                        foundSlice = slice;
                    }
                }, this);
            }, this);

            var foundData = {
                segment: foundSegment,
                slice: foundSlice,
                location: typeof foundSlice.tooltipPosition === 'function' ? foundSlice.tooltipPosition() : {
                    x: 0,
                    y: 0
                }
            };

            if(!this.USE_TOOL_TIP_INCOMPLETE_MESSAGE) {
                var locationACoordinates = {x:0, y: 0};
                if(typeof foundSegment !== 'undefined' &&
                    Object.prototype.hasOwnProperty.call(foundSegment, 'slices') &&
                    Object.prototype.hasOwnProperty.call(foundSegment.slices, 0) &&
                    typeof foundSegment.slices[0].tooltipPosition === 'function'
                ) {
                    locationACoordinates = foundSegment.slices[0].tooltipPosition();
                }
                $.extend(foundData, {locationA: locationACoordinates});
            }

            return foundData;
        },

        /**
         * Add on click events.
         */
        addBindEvents: function () {

            if (this.options.isLessThanIE9) { // IE 7 and 8 execute bind events in reverse order compared to other browsers.
                this.addUpdateSelectedSliceEvents();
                this.addOnclickEvents();
                return;
            }

            this.addOnclickEvents();
            this.addUpdateSelectedSliceEvents();
        },

        /**
         * Update the slice heights and drop shadows so when the user clicks a slice it becomes the new active slice.
         *
         * @return void
         */
        addUpdateSelectedSliceEvents: function () {
            helpers.bindEvents(this, this.options.actionEvents, function (event) {
                this.updateSelectedSegment(event);
                this.draw();
                if (typeof this.options.onToolTipRedraw === 'function') {
                    this.options.onToolTipRedraw.call(this);
                }
            }.bind(this));
        },

        /**
         * @function getSlicesAtEvent
         *
         * @class Chart
         *
         * @param e
         * @returns {Object|Boolean}
         */
        updateSelectedSegment: function (e) {
            var previousSelectedSegment = {}, selectedSegment = {};

            var location = helpers.getRelativePosition(e);

            helpers.each(this.segments, function (segment) {
                helpers.each(segment.slices, function (slice) {
                    if (slice.inRange(location.x, location.y)) {
                        selectedSegment = segment;
                    }
                }, this);
                if (segment.isSelected === true) {
                    previousSelectedSegment = segment;
                }
            }, this);

            this.applySelectedHeights(selectedSegment, previousSelectedSegment);
        },

        /**
         * Adjust and apply the heights to each segment slice based on if it has been selected or previously selected.
         *
         * @param selectedSegment
         * @param previousSelectedSegment
         */
        applySelectedHeights: function (selectedSegment, previousSelectedSegment) {

            if (typeof selectedSegment.label === 'undefined') {
                return; // Do nothing as the user has not clicked a segment.
            }

            // On page load previous selected segment will be undefined.
            if (typeof previousSelectedSegment !== 'undefined') {

                if (previousSelectedSegment.label === selectedSegment.label) {
                    return; // Do nothing as the user has selected the same segment as before.
                }

                // Revert previously selected values
                helpers.each(previousSelectedSegment.slices, function (slice) {
                    slice.height = (slice.height / this.SELECTED_SLICE_HEIGHT) * this.NORMAL_SLICE_HEIGHT;
                }.bind(this));

                previousSelectedSegment.height = this.getSegmentHeight(previousSelectedSegment.slices);
                previousSelectedSegment.isSelected = false;
                previousSelectedSegment.hasDropShadow = false;
            }

            // Update new segment values
            helpers.each(selectedSegment.slices, function (slice) {
                slice.height = (slice.height / this.NORMAL_SLICE_HEIGHT) * this.SELECTED_SLICE_HEIGHT;
            }.bind(this));

            selectedSegment.height = this.getSegmentHeight(selectedSegment.slices);
            selectedSegment.isSelected = true;
            selectedSegment.hasDropShadow = true;
        },

        addStartEndTextBoxes: function () {
            var data = [];

            this.addClockFaceData(data, {
                percentage: 2.1,
                text: this.START_TAG,
                clockArmLineWidth: 0,
                clockDrawTextBox: true,
                clockTextPaddingXAxis: radius / 9.5,
                clockTextBoxPadding: this.PADDING_OF_PIE_CHART_OUTSIDE_TEXT_BOX - 2,
                clockTextFlip: false,
                clockTextRotation: this.TEXT_ALIGN_ALONG_CIRCUMFERENCE,
                clockTextWeight: 'bold',
                clockTextBoxTipAlign: 'left',
                clockTextBoxRoundedCorner: this.options.clockTextBoxRoundedCorner,
                chartFontSize: this.FONT_SIZE_START_AND_END_BOXES,
                clickEvent: {
                    id: this.START_TAG,
                    event: function() {
                        window.location = this.urls.my_study_plan;
                    }.bind(this)
                }
            });

            this.addClockFaceData(data, {
                percentage: -1.55,
                text: this.END_TAG,
                clockArmLineWidth: 0,
                clockDrawTextBox: true,
                clockTextPaddingXAxis: radius / 9.5,
                clockTextBoxPadding: this.PADDING_OF_PIE_CHART_OUTSIDE_TEXT_BOX - 2,
                clockTextFlip: false,
                clockTextRotation: this.TEXT_ALIGN_ALONG_CIRCUMFERENCE,
                clockTextWeight: 'bold',
                clockTextBoxTipAlign: 'right',
                clockTextBoxRoundedCorner: this.options.clockTextBoxRoundedCorner,
                chartFontSize: this.FONT_SIZE_START_AND_END_BOXES,
                clickEvent: {
                    id: this.END_TAG,
                    event: function() {
                        window.location = this.urls.my_study_plan;
                    }.bind(this)
                }
            });

            return data;
        },

        /**
         * Add the clock arms to the spie chart, and the current day text box marker.
         */
        addClockArms: function () {

            var data = [];

            // Add blank clock arm at zero position.
            this.addClockFaceData(data, {percentage: 0, clockArmLineWidth: this.THICK_LINE_WIDTH});

            // Add today's text box positioned by today's date.
            this.addClockFaceData(data, {
                percentage: this.clockArmPosition,
                text: this.CLOCK_ARM_TAG,
                clockDrawTextBox: true,
                clockTextBoxPadding: this.PADDING_OF_PIE_CHART_OUTSIDE_TEXT_BOX,
                clockTextFlip: false,
                clockTextRotation: this.TEXT_ALIGN_ALONG_CIRCUMFERENCE,
                clockTextWeight: 'bold',
                clockArmLineExtend: this.OUTSIDE_CHART_LINE_LENGTH,
                clockArmLineWidth: this.THICK_LINE_WIDTH,
                clockTextPaddingXAxis: 19,
                clockTextBoxTipAlign: 'center',
                clockTextBoxRoundedCorner: this.options.clockTextBoxRoundedCorner
            });

            return data;
        },

        /**
         * Method to add new data to the clock face and encapsulates the clockData json array parameter requirements.
         *
         * Required Parameters:
         *
         * @param {Array[]} clockData[] - The array of data to add the new set of data to.
         * @param {Object} data - The new object set of data to add to the clock face of the pie chart.
         * @param {Number} data.percentage The position of the clock arm in percentage.
         *
         * Optional Parameters:

         * @param {String} [data.text=''] - The text to display at the tip of the clock arm.
         * @param {Number} [data.clockArmLineExtend=100] - The clock arm length in percentage relative to radius.
         * @param {Number} [data.clockArmLineWidth=1] - Width of the clock arm, use 0 to not draw the arm.
         * @param {Boolean} [data.clockDrawTextBox=false] - If a box should be draw around the text.
         * @param {Number} [data.clockTextBoxPadding=2] - Padding inside the text box drawn around the chart.
         * @param {Boolean} [data.clockTextFlip=true] - Text should be flipped when past 50% of the clock face.
         * @param {Number} [data.clockTextPaddingXAxis=3] - Padding from the radius, add to text drawn around pie chart.
         * @param {Number|Boolean} [data.clockTextRotation=0] - The amount of degree to rotate the text.
         * @param {String} [data.clockArmColour=black] - The colour of the clock arm.
         * @param {Number} [data.chartFontSize=12] - The font size for the text at the tip of this clock arm.
         * @param {String} [data.clockTextColour=black] - The colour of the text around the pie chart.*
         * @param {String} [data.clockTextFont=Arial] - The font to use for the text around the pie chart.
         * @param {String} [data.clockTextBoxFontColour=#fff] - The hex ccs colour for the font in the text box.
         * @param {String} [data.clockTextBoxFillColour=#000] - The hex ccs colour for the box background colour.
         * @param {String|Number} [data.clockTextWeight=normal] - CSS font weight value can be string or number.
         * @param {String} [data.clockTextBoxTipAlign=center] - left|right|center, Where the box tip point should align.
         * @param {Boolean} [data.switchTextAlignment=false] - true|false Should the text align left or right when passing 50% of the clock face.
         * @param {Boolean} [data.clockTextBoxUseUppercase=true] - true|false Should the text in text box be transformed to uppercase.
         * @param {Boolean} [data.location={}] - Location  object with mouse pos X/Y coordinates relative to parent canvas div.
         * @param {Number} [data.clockTextBoxFillAlpha=1] - Alpha setting for box fill colour.
         * @param {Number} [data.clockTextBoxRoundedCorner=0] - The amount to curve text box corners
         *
         * @param {Object} [data.clickEvent=false|object] - A object holding click event id and event anonymous function
         * @param {String|Boolean} [data.clickEvent.id - The id to identify the click event
         * @param {Function|Boolean} [data.clickEvent.event=false|function] - An anonymous function to act on the click event.
         *
         * @returns {*}
         */
        addClockFaceData: function (clockData, data) {
            clockData.push({
                percentage: data.percentage,
                text: typeof data.text === 'string' ? data.text : '',
                clockArmLineExtend: typeof data.clockArmLineExtend === 'number' ? data.clockArmLineExtend : 100,
                clockArmLineWidth: typeof data.clockArmLineWidth === 'number' ? data.clockArmLineWidth : this.options.clockArmLineWidth,
                clockDrawTextBox: typeof data.clockDrawTextBox === 'boolean' ? data.clockDrawTextBox : false,
                clockTextBoxPadding: typeof data.clockTextBoxPadding === 'number' ? data.clockTextBoxPadding : this.options.clockTextBoxPadding,
                clockTextFlip: typeof data.clockTextFlip === 'boolean' ? data.clockTextFlip : this.options.clockTextFlip,
                clockTextPaddingXAxis: typeof data.clockTextPaddingXAxis === 'number' ? data.clockTextPaddingXAxis : this.options.clockTextPaddingXAxis,
                clockTextRotation: typeof data.clockTextRotation !== 'undefined' ? data.clockTextRotation : this.options.clockTextRotation,
                clockArmColour: typeof data.clockArmColour === 'string' ? data.clockArmColour : this.options.clockArmColour,
                chartFontSize: typeof data.chartFontSize === 'number' ? data.chartFontSize : this.options.chartFontSize,
                clockTextColour: typeof data.clockTextColour === 'string' ? data.clockTextColour : this.options.clockTextColour,
                clockTextFont: typeof data.clockTextFont === 'string' ? data.clockTextFont : this.options.clockTextFont,
                clockTextBoxFontColour: typeof data.clockTextBoxFontColour === 'string' ? data.clockTextBoxFontColour : this.options.clockTextBoxFontColour,
                clockTextBoxFillColour: typeof data.clockTextBoxFillColour === 'string' ? data.clockTextBoxFillColour : this.options.clockTextBoxFillColour,
                clockTextWeight: typeof data.clockTextWeight === 'string' || typeof data.clockTextWeight === 'number' ? data.clockTextWeight : this.options.clockTextWeight,
                clockTextBoxTipAlign: typeof data.clockTextBoxTipAlign === 'string' ? data.clockTextBoxTipAlign : 'center',
                switchTextAlignment: typeof data.switchTextAlignment === 'boolean' ? data.switchTextAlignment : false,
                clockTextBoxUseUppercase: typeof data.clockTextBoxUseUppercase === 'boolean' ? data.clockTextBoxUseUppercase : true,
                location: typeof data.location === 'object' ? data.location : {},
                clockTextBoxFillAlpha: typeof data.clockTextBoxFillAlpha !== 'undefined' ? data.clockTextBoxFillAlpha : 1,
                clockTextBoxRoundedCorner: typeof data.clockTextBoxRoundedCorner !== 'undefined' ? data.clockTextBoxRoundedCorner : 0,
                clickEvent: typeof data.clickEvent !== 'undefined' ? data.clickEvent : false
            });
            return clockData;
        },

        /**
         * @function clockArmsWithText
         *
         * Draw clock faced lines on the chart positioned using percentage.
         *
         * @param {Array[]} clockData[] - See function this.addClockFaceData() for clockData[] array description.
         */
        clockArmsWithText: function (clockData) {
            helpers.each(clockData, function (newData) {
                this.drawClockPointsByClockData(newData);
            }.bind(this));
        },

        /**
         * data.clockTextFlip is set to false when drawing the clock arm with the black text box marking
         * the position of 'Today' around the chart. In this case they don't want to switch the rotation
         * of the text when going past a position which is more than 50% way round the pie charts circumference.
         *
         * mod is used when marking the dates for example 26 Jun, 19 Jul ect.. In this case the text is
         * required to rotate once past 50% of the pie charts circumference. (If you imagine the pie chart
         * as if it was a clock face then you could also say when it is past 6 o'clock rotate the text)
         *
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @returns {*}
         */
        drawClockPointsByClockData: function (newData) {

            var mod = newData.percentage % 100;

            if (newData.clockTextFlip === false || mod >= 0 && mod < 50) {
                return this.clockFaceRightHalf(newData);
            }
            return this.clockFaceLeftHalf(newData);
        },

        /**
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @returns {*}
         */
        clockFaceRightHalf: function (newData) {
            var switchAlignment = typeof newData.switchTextAlignment === 'boolean' && newData.switchTextAlignment ? 'right' : 'left';
            return this.drawClockPointByDegrees(this.percentageToDegrees(newData.percentage) - 90, newBoxWidth, switchAlignment, newData);
        },

        /**
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @returns {*}
         */
        clockFaceLeftHalf: function (newData) {
            var switchAlignment = typeof newData.switchTextAlignment === 'boolean' && newData.switchTextAlignment ? 'left' : 'right';
            return this.drawClockPointByDegrees(this.percentageToDegrees(newData.percentage) + 90, -newBoxWidth, switchAlignment, newData);
        },

        /**
         * @param {Number} degrees
         * @param {Number} newLineXPos
         * @param {String} textAlign - left|right|center
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         */
        drawClockPointByDegrees: function (degrees, newLineXPos, textAlign, newData) {

            var overLapReAlign = this.modifyTextAlign(newData);

            if (overLapReAlign === false) {
                return false;
            }

            this.drawClockArm(newData, degrees, newLineXPos);
            this.drawText(newData, degrees, newLineXPos, textAlign, overLapReAlign);
        },

        /**
         *
         * @param {Object} newData
         * @param {Number} degrees
         * @param {Number} newLineXPos
         * @param {String} textAlign
         * @param {Number|Boolean} overLapReAlign - Modify the text position when overlapping.
         */
        drawText: function (newData, degrees, newLineXPos, textAlign, overLapReAlign) {
            if (!newData.text.length) {
                return; // There is nothing to do as there is no text to output, just return.
            }

            if (typeof context === 'undefined') {
                return;
            }

            context.save();

            if (newData.clockTextRotation !== false) {
                context.translate(centerX, centerY);
                context.rotate((degrees + newData.clockTextRotation) * (Math.PI / 180));
            }

            var paddingMultiplier = newData.clockTextPaddingXAxis / 100 + 1;

            if (newData.clockDrawTextBox === true) {
                this.buildTextBoxText(newData, newLineXPos, paddingMultiplier * (this.TEXT_BOX_POSITION_FROM_CIRCUMFERENCE / 100), overLapReAlign);
            } else {
                var chartFontSize = this.getReSizedFontSize(newData);
                this.prepareText(
                    chartFontSize, textAlign, newData.clockTextColour, newData.clockTextFont, newData.clockTextWeight
                );
                context.fillText(newData.text, newLineXPos * paddingMultiplier, chartFontSize / 3);
            }

            this.updateHitPointMap(newData, context);

            context.restore();
        },

        /**
         * @param {Object} newData
         * @param {Object} newData.clickEvent
         * @param {String} newData.clickEvent.id - The name of click event
         * @param {Function} newData.clickEvent.event - A event function @example function(){ // event code here }}
         * @param {Object} context - Canvas context
         */
        updateHitPointMap: function (newData, context) {

            // IE7-8 can't handle using context.isPointInPath() so return, also if no click event then return.
            // In fact disable for IE completely as it can't handle lots of loops with out slowing down massively.
            if (this.options.isIE ||
                typeof newData.clickEvent !== 'object' ||
                typeof newData.clickEvent.id !== 'string' ||
                typeof newData.clickEvent.event !== 'function'
            ) {
                return false;
            }

            var id = newData.clickEvent.id;

            // NOTE: this.hitPointMap has to be an array of objects because some browsers don't respect the order
            // of properties added to objects, although this adds a seemingly pointless extra array level to the whole
            // hitPointMap it is needed to get to the hit point maps x,y values and it is required to keep the correct
            // order of elements. As what comes first in the hitPointMap array is considered to be an element that is
            // drawn on top of an other elements.

            // Check we haven't already mapped this shape/elements hit points.
            for (var count = 0; count < this.hitPointMap.length; count++) {
                var hitPointMap = this.hitPointMap[count];
                if (Object.prototype.hasOwnProperty.call(hitPointMap, 'id') && hitPointMap.id === id) {
                    return; // Its already been done don't update again.
                }
            }

            newData.clickEvent.map = []; // Initialise hit point array map

            // Always add to the start of the map, so that elements that are draw on top of other elements come first.
            this.hitPointMap.push(newData.clickEvent);

            // Its safe to just use index 0 because of the use of unshift() on hitPointMap above.
            var hitPoint = this.hitPointMap[0];

            for (var xPos = 0; xPos < this.chart.width; xPos++) {

                var yPosStartFound = false;
                var yPosLastFound = false;

                for(var yPos = 0; yPos < this.chart.height; yPos++) {
                    if(context.isPointInPath(xPos, yPos)) {
                        if (yPosStartFound) {
                            yPosLastFound = yPos;
                            continue;
                        }
                        if (!Object.prototype.hasOwnProperty.call(hitPoint.map, xPos)) {
                            hitPoint.map[xPos] = [];
                        }
                        hitPoint.map[xPos].push(yPos); yPosStartFound = true;
                    }

                    if (yPosLastFound) {
                        hitPoint.map[xPos].push(yPosLastFound); yPosStartFound = yPosLastFound = false; // reset
                    }
                }
            }

            return true;
        },

        /**
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @param {Number} degrees
         * @param {Number} newLineXPos
         */
        drawClockArm: function (newData, degrees, newLineXPos) {
            // Only draw a clock arm if a width has been specified for it.
            if (newData.clockArmLineWidth === 0 || typeof context === 'undefined') {
                return;
            }
            context.save();
            context.translate(centerX, centerY);

            context.rotate(degrees * (Math.PI / 180));

            context.beginPath(); // always start a new line with beginPath
            context.lineWidth = newData.clockArmLineWidth;
            context.moveTo(0, 0); // start position
            context.lineTo(newLineXPos * (newData.clockArmLineExtend / 100), 0);
            context.strokeStyle = newData.clockArmColour;
            context.stroke(); // actually draw the line
            context.restore();
        },

        /**
         * Add any line fills to arc slices that have fill style configured.
         */
        fillShapes: function () {
            helpers.each(this.segments, function (segment) {
                if (segment.fillStyle !== this.FILL_SHAPE_DIAGONAL_WITH_LINES) {
                    return;
                }

                var canvasWidth = this.SCALE_RATIO_DENOMINATOR;

                if (typeof canvas !== 'undefined' && canvas.width !== 'undefined') {
                    canvasWidth = canvas.width;
                }

                segment.drawLineFills(canvasWidth, this);
            }.bind(this));
        },

        /**
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @param {Number} newLineXPos - The new x position of the text box.
         * @param {Number} paddingMultiplier - The additional padding to add to the new x position.
         * @param {Number|Boolean} overLapReAlign - Modify the text position when overlapping.
         *
         * @return {Boolean}
         */
        buildTextBoxText: function (newData, newLineXPos, paddingMultiplier, overLapReAlign) {

            var chartFontSize = this.getReSizedFontSize(newData);

            var halfBox = 2;

            var padding = newData.clockTextBoxPadding;

            this.prepareText(
                chartFontSize, 'left', newData.clockTextBoxFontColour, newData.clockTextFont, newData.clockTextWeight
            );

            var displayText = newData.clockTextBoxUseUppercase === true ? newData.text.toUpperCase() : newData.text;

            var textWidth = context.measureText(displayText).width; // 20 = 10px padding

            var boxWidth = textWidth + padding;
            var boxHeight = chartFontSize + padding;

            if (newData.clockTextRotation !== false) {
                context.translate(-(boxWidth / halfBox) * overLapReAlign, -(newLineXPos * paddingMultiplier));
            } else {
                context.translate(newData.location.x - (boxWidth / halfBox), newData.location.y - boxHeight * 1.3);
            }

            // Draw a box around the text with a pointer arrow.
            context.beginPath(); // Always start a new line with beginPath.
            context.moveTo(0, 0); // Start position.

            if (this.options.isLessThanIE9) {
                this.drawSquareTextBox(newData, boxWidth, boxHeight, halfBox, chartFontSize);
            } else {
                this.drawRoundedCornersTextBox(newData, boxWidth, boxHeight, halfBox, chartFontSize);
            }

            context.lineTo(0, 0); // Close and finish drawing the box by returning to the start position.
            context.fillStyle = newData.clockTextBoxFillColour;
            context.globalAlpha = newData.clockTextBoxFillAlpha;
            context.fill();

            this.prepareText(
                chartFontSize, 'left', newData.clockTextBoxFontColour, newData.clockTextFont, newData.clockTextWeight
            );

            var xPos = padding / 2;
            var yPos = chartFontSize - 1 + padding / Math.PI;

            context.fillText(displayText, xPos, yPos);
        },

        /**
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @param {Number} boxWidth
         * @param {Number} boxHeight
         * @param {Number} halfBox
         * @param {Number} chartFontSize
         */
        drawSquareTextBox: function (newData, boxWidth, boxHeight, halfBox, chartFontSize) {

            context.lineTo(boxWidth, 0); // Top right corner.
            context.lineTo(boxWidth, boxHeight); // bottom right corner.

            this.addPointerTip(newData, boxWidth, boxHeight, halfBox, chartFontSize);

            context.lineTo(0, boxHeight); // Bottom left corner
        },

        /**
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @param {Number} boxWidth
         * @param {Number} boxHeight
         * @param {Number} halfBox
         * @param {Number} chartFontSize
         */
        drawRoundedCornersTextBox: function (newData, boxWidth, boxHeight, halfBox, chartFontSize) {

            var roundedCorner = newData.clockTextBoxRoundedCorner * 1.05;

            context.lineTo(boxWidth - roundedCorner, 0); // Top right corner.
            context.arcTo(boxWidth, 0, boxWidth, roundedCorner, roundedCorner); // round corner

            if (newData.clockTextBoxTipAlign === 'right') {
                // When the the text pox has its arrow pointer aligned to the right, don't round that corner.
                context.lineTo(boxWidth, boxHeight);
            } else {
                context.lineTo(boxWidth, boxHeight - roundedCorner); // bottom right corner.
                context.arcTo(boxWidth, boxHeight, boxWidth - roundedCorner, boxHeight, roundedCorner); // round corner
            }

            this.addPointerTip(newData, boxWidth, boxHeight, halfBox, chartFontSize);

            if (newData.clockTextBoxTipAlign === 'left') {
                // When the the text pox has its arrow pointer aligned to the left, don't round that corner.
                context.lineTo(0, boxHeight);
            } else {
                context.lineTo(roundedCorner, boxHeight); // Bottom left corner
                context.arcTo(0, boxHeight, 0, boxHeight - roundedCorner, roundedCorner); // round corner
            }

            context.arcTo(0, 0, roundedCorner, 0, roundedCorner); // round corner
        },

        /**
         * Show/hide or reposition the START and END text boxes depending on the current clock arm position.
         *
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         *
         * @returns {*}
         */
        modifyTextAlign: function (newData) {

            var text = newData.text, pos = this.clockArmPosition;

            if ((text === this.CLOCK_ARM_TAG || !text.length) && pos === false) {
                return false;
            }

            if (pos >= 94) {
                if (text === this.CLOCK_ARM_TAG) {
                    newData.clockTextBoxTipAlign = 'right';
                    return 1.75;
                }
                if (text === this.END_TAG && pos >= 96.5) {
                    return false;
                }
                if (text === this.START_TAG && pos === 100) {
                    return 0.85;
                }
            }

            if (pos >= 0) {
                if (pos !== false && pos <= 4.5 && text === this.START_TAG) {
                    return false;
                }
                if (text === this.CLOCK_ARM_TAG) {
                    if (pos < 6.5) {
                        newData.clockTextBoxTipAlign = 'left';
                        return 0.25;
                    }
                    newData.clockTextBoxTipAlign = 'center';
                }
                if (text === this.END_TAG && pos === 0) {
                    return 1.2;
                }
            }
            return 1;
        },

        /**
         * Draw the tip pointer aligned left,right or center of the text box.
         *
         * @param {Object} newData - See function: this.addClockFaceData() for newData[]{} object description.
         * @param {Number} boxWidth
         * @param {Number} boxHeight
         * @param {Number} halfBox
         * @param {Number} chartFontSize
         */
        addPointerTip: function (newData, boxWidth, boxHeight, halfBox, chartFontSize) {
            switch (newData.clockTextBoxTipAlign) {
                case 'left':
                    context.lineTo(chartFontSize, boxHeight); // bottom just short of center.
                    context.lineTo(chartFontSize / halfBox, boxHeight + chartFontSize / halfBox); // bottom arrow tip.
                    context.lineTo(0, boxHeight); // close bottom arrow tip.
                    break;
                case 'right':
                    context.lineTo(boxWidth - chartFontSize, boxHeight); // bottom just short of left.
                    context.lineTo(boxWidth - chartFontSize / halfBox, boxHeight + chartFontSize / halfBox); // bottom arrow tip.
                    context.lineTo(boxWidth, boxHeight); // close bottom arrow tip.
                    break;
                case 'center':
                    context.lineTo(boxWidth / halfBox - chartFontSize / halfBox, boxHeight); // bottom just short of center.
                    context.lineTo(boxWidth / halfBox, boxHeight + chartFontSize / halfBox); // bottom arrow tip.
                    context.lineTo(boxWidth / halfBox + chartFontSize / halfBox, boxHeight); // close bottom arrow tip.
                    break;
            }
        },

        /**
         * Font size 12 would result in 0.024 Multiplier
         *
         * @param {Object} newData - See function: this.addClockFaceData() for newData{} object description
         *
         * @returns {Number}
         */
        getReSizedFontSize: function (newData) {
            return canvas.width * (newData.chartFontSize * 2 / 1000);
        },

        /**
         * @param {Number} chartFontSize
         * @param {String} textAlign
         * @param {String} fillStyle
         * @param {String} font
         * @param {String|Number} clockTextWeight
         */
        prepareText: function (chartFontSize, textAlign, fillStyle, font, clockTextWeight) {
            context.font = clockTextWeight + ' ' + chartFontSize.toString() + "px " + font;
            context.fillStyle = fillStyle;
            context.textAlign = textAlign;
        },

        /**
         * Draw the dates around the clock @example 26 Jun, 15 Jul ect...
         * Draw the label text on each slice and...
         */
        drawSegmentData: function () {

            var totalPercentage = 0, count = 0, data = [];

            for (var i = 0; i < this.segments.length; i++) {

                var segment = this.segments[i];

                var percentModifier = 0;

                if (count++ === 1) { // Check for first element and change position slightly, then increment count.
                    percentModifier = 0.75;
                }

                if (count === this.segments.length) {
                    percentModifier = -0.75; // Check for last element and change position slightly.
                }

                if (segment.enableDrawDate !== false) {
                    // Draw the dates around the clock @example 26 Jun, 15 Jul ect...
                    this.drawDate(segment, totalPercentage + percentModifier);
                }

                if (segment.label !== 'end') {

                    // Draw the label text on each slice and...
                    this.addClockFaceData(data, {
                        percentage: (segment.width / 2) + totalPercentage,
                        text: segment.label,
                        clockArmLineWidth: 0,
                        clockTextPaddingXAxis: -((this.options.clockInnerTextPaddingXAxis / 100) * radius),
                        clockTextBoxPadding: 0,
                        clockTextFlip: true,
                        clockTextRotation: this.TEXT_ALIGN_RIGHT_ANGLE_FROM_CIRCUMFERENCE,
                        switchTextAlignment: true,
                        clockTextColour: segment.height === this.SELECTED_SLICE_HEIGHT ? 'black' : segment.clockTextColour,
                        clockTextWeight: segment.height === this.SELECTED_SLICE_HEIGHT ? 'bold' : segment.clockTextWeight,
                        chartFontSize: this.options.chartFontSize * 0.8
                    });
                }

                totalPercentage += segment.width;
            }

            this.clockArmsWithText(data);
        },

        /**
         * @param {Object} segment - See function: Chart.Spie.addData().segments.splice for segment{} object.
         * @param {Number} totalPercentage
         */
        drawDate: function (segment, totalPercentage) {

            var clockData = [];

            this.addClockFaceData(clockData, {
                percentage: totalPercentage,
                text: segment.date,
                // Use a ratio for font size, so responsive scaling works.
                chartFontSize: this.options.chartFontSize * this.options.dateTextRatio,
                clockArmLineWidth: 0
            });

            this.clockArmsWithText(clockData);
        },

        /**
         * Displays the detailed topic stats, when a user clicks on a pie chart slice.
         *
         * @param {Array} nodeSet - array of study sessions and hurdle tests to list for a topic that has been selected.
         * @param {Object} template - html template element see study-stats.tpl
         */
        buildNodeSet: function(nodeSet, template) {

            var nodeSetClone = nodeSet.slice(0); // Slice 0 makes a clone and drops the reference.

            var reversedNodeSet = nodeSetClone.reverse();

            /**
             * @param {Object} node
             * @param {String} node.completion
             * @param {String} node.label
             * @param {String} node.name
             * @param {Number} node.nodeId
             * @param {Number} node.nodeStatus
             * @param {Number} node.score
             * @param {String} node.nodeContentUrl
             */
            $.each(reversedNodeSet, function(index, node) {

                var progressNodeTemplate = $('#progress-node-template').clone(true);

                progressNodeTemplate.removeClass('hide');
                progressNodeTemplate.removeAttr('id');

                var progressContainer = $('.progress-container', progressNodeTemplate);
                var progressBar = $('.progress-bar', progressNodeTemplate);
                var progressScore = $('.progress-score', progressNodeTemplate);
                var progressText = $('.progress-text', progressNodeTemplate);

                progressNodeTemplate.attr('id', 'node-id-' + node.nodeId);
                progressNodeTemplate.attr('title', 'Completed ' + node.completion + '%, Score ' + node.score + '%');

                this.removeListOfClasses(4, progressBar, 'progress-colour-');

                progressBar.addClass('progress-colour-' + node.nodeStatus);
                progressBar.css({width: node.completion + '%'});

                progressScore.html(node.score + '%');
                progressText.html(node.name);

                if (node.active === 'yes' && node.menuId !== 0) {
                    progressNodeTemplate.click(function() {

                        var replaceMap = {"%menuId%": node.menuId, "%nodeId%": node.nodeId};

                        window.location = this.replaceAll(this.nodeStats.contentNodeUrl, replaceMap);

                    }.bind(this));
                } else {
                    progressNodeTemplate.attr('title', 'Inactive');
                    progressContainer.addClass('progress-action-off');
                }

                // Use prepend because the template has markup at the end of it
                // see study-stats.tpl element template id="stats-section-template"
                template.prepend(progressNodeTemplate);

            }.bind(this));
        },

        /**
         * Function to perform mapped string replace, like sprintf
         *
         * @param {String} str
         * @param {Object} mapObj - {'paramMapName1': paramMapValue1, 'paramMapName2': paramMapValue2}
         * @returns {*}
         */
        replaceAll: function (str, mapObj){
            var regx = new RegExp(Object.keys(mapObj).join("|"),"gi");
            return str.replace(regx, function(matched){
                return mapObj[matched];
            });
        },

        /**
         * Map the dataStats data to view ids or class names.
         */
        addDataViewMap: function() {

            var parentContentUrl = function (template, viewParamName, value, nodeStatsData) {
                var element = $('.' + viewParamName, template);
                element.removeAttr('onclick');

                var replaceMap = {"%menuId%": nodeStatsData.parentMenuId, "%nodeId%": nodeStatsData.parentId};

                if (nodeStatsData.parentMenuId !== 0) {
                    element.removeClass('grad-title-action-off');
                    element.click(function() {
                        window.location = this.replaceAll(this.nodeStats.contentNodeUrl, replaceMap);
                    }.bind(this));
                } else {
                    element.addClass('grad-title-action-off');
                }
            }.bind(this);

            var parentStatus = function (template, viewParamName, value) {
                var elementClone = $('.' + viewParamName, template);
                var elementClassName = 'status-colour-';

                $.map(new Array(4), function (x, index) {
                    elementClone.removeClass(elementClassName + index);
                });

                elementClone.addClass(elementClassName + value);
            };

            this.dataViewMapping = {
                'title-right-date': 'parentDueDate',
                'average-mark': 'parentAverage',
                'progress-text': 'name',
                'progress-score': 'score',
                'progress-colour': 'colour',
                'topic-title': 'parentName',
                'grad-title': {
                    'parentContentUrl': parentContentUrl
                },
                'stats-average-right': {
                    'parentStatusText': '',
                    'parentStatus': parentStatus
                }
            };
        },

        /**
         * @param {Number} dotRadiusPercent - percentage relative to radius 0.5% of radius will make a dot in the center
         */
        centerDot: function (dotRadiusPercent) {
            if (typeof context === 'undefined') {
                return;
            }
            context.beginPath();
            context.arc(centerX, centerY, radius * (dotRadiusPercent / 100), 0, 2 * Math.PI, false);
            context.fillStyle = this.options.clockArmColour;
            context.fill();
        },

        /**
         * Detect if the browser can support html 5 canvas, feature detection for IE7-8.
         * @returns {boolean}
         */
        isCanvasSupported: function () {
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        }

    });

}).call(this);