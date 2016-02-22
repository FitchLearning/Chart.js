/*global CustomConsole, Chart, console, $, CanvasWrapper*/

var FitchLearning = FitchLearning || {};
FitchLearning.ChartManager = FitchLearning.ChartManager || {};

(function(w){

    "use strict";

    FitchLearning.ChartManager = function() {

        this.PAGE_AB_TEST_A = 'A';
        this.PAGE_AB_TEST_B = 'B';

        var this_ = this,
            chartId = "chart-area",
            cookieTabKey = 'pageAB';

        /**
         * @access private
         *
         * @param data
         * @param {Array=} nodeStats - optional parameter
         */
        function buildChart(data, nodeStats) {

            var canvas = document.getElementById(chartId);
            var context = canvas.getContext("2d");

            if (nodeStats) {
                data.nodeStats = nodeStats;
            }

            w.FitchLearning.Chart = new Chart(context, chartId).Fitch(data, {
                responsive: true,
                containerId: ".stats",
                templateId: ".node-stats-section"
            });
        }

        /**
         * Use this method to load all chart data on page load, and not use ajax requests
         *
         * @access public
         *
         * @param {Array} data
         * @param {Array} nodeStats
         */
        function buildUsingOnPageLoad(data, nodeStats) {
            $(w).load(function() {
                buildChart(data, nodeStats);
            });
        }

        /**
         * Use this method if there is a requirement to load chart data from ajax requests.
         *
         * @access public
         *
         * @param {String} url
         * @param {Array} nodeStats
         */
        function buildUsingAjax(url, nodeStats) {
            $.ajax({
                url: url
            }).success(function(data) {
                buildChart(data, nodeStats);
            }).fail(function() {
                console.log("ChartManager.requestChartData() Failed: " + JSON.stringify(arguments, null, 4));
            });
        }

        /**
         * Use this method to load the chart from clicking a tab, this is useful for launch when both old and new charts
         * will be used, and this will enable switching between them and loading the chart onclick.
         *
         * @access public
         *
         * @param {Array} data
         * @param {Array} nodeStats
         * @param {String} tabs - ccs class name for the tabs @example '.tabrow li'
         * @param {String} pageA - css class name of pageA
         * @param {String} pageB - css class name of pageB
         * @param {String} tabState - ccs active state class name for tabs
         * @param {String} contentState - css disabled state class name for for tab content
         */
        function buildUsingOnClick(data, nodeStats, tabs, pageA, pageB, tabState, contentState) {
            $(w).load(function() {

                $(tabs).click(function(e) {

                    e.preventDefault();

                    if ($(this).hasClass(tabState)) {
                        return;
                    }

                    toggleChart("." + $(this).attr('class'), data, nodeStats, tabs, pageA, pageB, tabState, contentState);

                    if($(pageB).is( ":visible" )) {
                        $.cookie(cookieTabKey, this_.PAGE_AB_TEST_B);
                    }
                });

                // Select pageB On page load if user has it selected previously
                var page = $.cookie(cookieTabKey);
                if (page === this_.PAGE_AB_TEST_B) {
                    toggleChart(pageB + '-tab', data, nodeStats, tabs, pageA, pageB, tabState, contentState);
                }

                // Default to chart A performance chart
                showChartA(pageA, data, nodeStats);
            });
        }

        /**
         * Switch which page content should be show and also switch which tab is selected.
         *
         * @access private
         *
         * @param {String} selectedTab - class or id of the selected element
         * @param {Array} data - The data to use to draw the chart
         * @param {Array} nodeStats - The node stats data to use to draw the detailed topic stats when clicking a slice.
         * @param {String} tabs - class or id of the tabs container
         * @param pageA - class or id of pageA content
         * @param pageB - class or id of pageB content
         * @param tabState - The class name for highlighting a tab as on or off
         * @param contentState - the class name to hide the non selected pages content.
         */
        function toggleChart(selectedTab, data, nodeStats, tabs, pageA, pageB, tabState, contentState) {
            $(tabs).removeClass(tabState);
            $(selectedTab).addClass(tabState);
            $(pageA).toggleClass(contentState);
            $(pageB).toggleClass(contentState);
            showChartA(pageA, data, nodeStats);
        }

        /**
         * Make chart A visible
         *
         * @access private
         *
         * @param pageA
         * @param data
         * @param nodeStats
         */
        function showChartA(pageA, data, nodeStats) {
            if($(pageA).is( ":visible" )) {
                $.cookie(cookieTabKey, this_.PAGE_AB_TEST_A);
                if (!w.FitchLearning.Chart) {
                    buildChart(data, nodeStats);
                }
            }
        }

        return {
            buildUsingOnPageLoad: buildUsingOnPageLoad,
            buildUsingAjax: buildUsingAjax,
            buildUsingOnClick: buildUsingOnClick
        };
    };

    w.FitchLearning.ChartManager = new FitchLearning.ChartManager();

})(window);
