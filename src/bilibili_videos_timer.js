// ==UserScript==
// @name         bilibili_videos_timer
// @namespace    https://github.com/Peilin-zzz-Eric/bilibili_videos_timer
// @version      0.2
// @license      MIT
// @description  View Bilibili video collection time information: total duration, watched duration, remaining duration, watched proportion and real-time progress;
// @author       Eric zzz
// @match        https://www.bilibili.com/video/*
// @icon         https://raw.githubusercontent.com/Peilin-zzz-Eric/bilibili_videos_timer/main/icon/timer.svg
// @grant        none
// @downloadURL
// @updateURL
// ==/UserScript==

(function() {

    // 1. 时间处理相关函数
    // Function to format time from hours, minutes, and seconds into "hh:mm:ss"
    function formatTime(hours, minutes, seconds) {
        var hoursString = hours.toString().padStart(2, "0");
        var minutesString = minutes.toString().padStart(2, "0");
        var secondsString = seconds.toString().padStart(2, "0");
        return hoursString + ":" + minutesString + ":" + secondsString;
    }

    // Function to add two times in "hh:mm:ss" format
    function addTime(time1, time2) {
        var timeParts1 = time1.split(":");
        var timeParts2 = time2.split(":");

        var hours = parseInt(timeParts1[0]) + parseInt(timeParts2[0]);
        var minutes = parseInt(timeParts1[1]) + parseInt(timeParts2[1]);
        var seconds = parseInt(timeParts1[2]) + parseInt(timeParts2[2]);

        // Handle overflow of seconds into minutes
        if (seconds >= 60) {
            minutes += Math.floor(seconds / 60);
            seconds = seconds % 60;
        }

        // Handle overflow of minutes into hours
        if (minutes >= 60) {
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;
        }

        return formatTime(hours, minutes, seconds);
    }

    // Function to subtract time2 from time1 in "hh:mm:ss" format
    function subtractTime(time1, time2) {
        var timeParts1 = time1.split(":");
        var timeParts2 = time2.split(":");

        var hours1 = parseInt(timeParts1[0]);
        var minutes1 = parseInt(timeParts1[1]);
        var seconds1 = parseInt(timeParts1[2]);

        var hours2 = parseInt(timeParts2[0]);
        var minutes2 = parseInt(timeParts2[1]);
        var seconds2 = parseInt(timeParts2[2]);

        // Convert times to total seconds for easier calculation
        var totalSeconds1 = (hours1 * 3600) + (minutes1 * 60) + seconds1;
        var totalSeconds2 = (hours2 * 3600) + (minutes2 * 60) + seconds2;
        var diffSeconds = totalSeconds1 - totalSeconds2;

        // Convert the result back into "hh:mm:ss"
        var hours = Math.floor(diffSeconds / 3600);
        var minutes = Math.floor((diffSeconds % 3600) / 60);
        var seconds = diffSeconds % 60;

        return formatTime(hours, minutes, seconds);
    }

    // Function to calculate the percentage of time watched compared to total time
    function calculatePercentage(part, total) {
        const partInSeconds = timeToSeconds(part);
        const totalInSeconds = timeToSeconds(total);
        if (totalInSeconds === 0) return "0%";
        const percentage = (partInSeconds / totalInSeconds) * 100;
        return percentage.toFixed(2) + "%";  // Keep percentage to two decimal places
    }

    // Convert time from "hh:mm:ss" format to total seconds
    function timeToSeconds(time) {
        const timeParts = time.split(":");
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        return (hours * 3600) + (minutes * 60) + seconds;
    }

    // Convert total seconds back to "hh:mm:ss" format
    function formatSecondsToTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }


    //2. DOM相关操作
    // Create and style the container for the icon
    const iconContainer = document.createElement("div");
    iconContainer.style.position = "fixed";
    iconContainer.style.bottom = "250px";
    iconContainer.style.left = "20px";
    iconContainer.style.padding = "0px"; // Increase clickable area
    iconContainer.style.cursor = "pointer";

    // Create and style the icon itself
    const icon = document.createElement("img");
    icon.src = "https://raw.githubusercontent.com/Peilin-zzz-Eric/bilibili_videos_timer/main/icon/timer.svg";
    icon.width = 30;
    icon.height = 30;

    // Append the icon to its container and the container to the body
    iconContainer.appendChild(icon);
    document.body.appendChild(iconContainer);

    // Create the span to display the video progress information
    var span = document.createElement("div");
    span.innerText = "";
    span.style.position = "fixed";
    span.style.bottom = "140px";
    span.style.left = "10px";
    span.style.padding = "10px";
    span.style.color = "black";
    span.style.border = "none";
    span.style.borderRadius = "5px";
    span.style.cursor = "pointer";
    span.id = "my_time_info";

    // Append the span to the body
    document.body.appendChild(span);


    //3. 更新和监控视频播放进度的逻辑
    let totalTime = "0:0:0";  // Total time of the video collection
    let watchedTime = "0:0:0";  // Time already watched
    let videoEventListener = null;  // Store event listener for video time updates

    // Utility function to get element by XPath
    function getElementByXPath(parent, xpath) {
        const result = document.evaluate(xpath, parent, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    }

    // Update the total and watched time information
    // Update video time information based on current video state
    function update_time_info() {
        let elements = [];
        const Dom_1 = document.getElementById("multi_page");

        // If using the structure DOM_1
        if (Dom_1) {
            const xpathExpression = "//*[@id='multi_page']//ul[@class='list-box']";
            const element = getElementByXPath(document, xpathExpression);
            if (element) elements = element.children;
        }
        // Calculate total time and watched time
        if (elements && elements.length > 0) {
            var date = "0:0:0";
            var Pasedate = "0:0:0";
            var onDate = "0:0:0";

            for (let i = 0; i < elements.length; i++) {
                const childElement = elements[i];
                let str = "0:0:0";

                if (Dom_1) {
                    str = getElementByXPath(childElement, ".//div[@class='duration']").innerText;
                }
                let str_arr = str.split(":");
                if (str_arr.length == 2) str = "0:" + str;  // Convert "mm:ss" format to "hh:mm:ss"
                if (str_arr.length == 1) str = "0:0:" + str;  // Convert "ss" format to "hh:mm:ss"

                date = addTime(date, str);  // Add the duration to the total time

                // Check if this is the currently playing video
                if (childElement.classList.contains("on")) {
                    Pasedate = date;
                    onDate = str;
                }
            }
            totalTime = date;
            watchedTime = subtractTime(Pasedate, onDate);

            // Calculate watched percentage and remaining time
            const percentageWatched = calculatePercentage(watchedTime, totalTime);
            const remainingTime = subtractTime(totalTime, watchedTime);

            // Get current video's play progress
            const video = document.querySelector("video");
            let currentTime = "0:0:0";
            let videoDuration = "0:0:0";

            if (video) {
                currentTime = formatSecondsToTime(video.currentTime);
                if (!isNaN(video.duration)) {
                    videoDuration = formatSecondsToTime(video.duration);
                } else {
                    videoDuration = "未知时长";  // Placeholder if duration is unavailable
                }
            }

            // Display the information in the span
            var time_info = `总长：${totalTime}\n已看：${watchedTime}\n剩余：${remainingTime}\n已看占比：${percentageWatched}\n实时进度：${currentTime} / ${videoDuration}`;
            span.innerText = time_info;
        }
    }

    // Monitor the video's play progress and update information in real-time
    function monitorVideoTime() {
        const video = document.querySelector("video");
        if (video && !videoEventListener) {
            videoEventListener = () => {
                const currentTime = video.currentTime;
                const duration = video.duration;
                let videoDuration = "未知时长";
                let realTimePercentage = "0%";

                if (!isNaN(currentTime) && !isNaN(duration)) {
                    const currentFormatted = formatSecondsToTime(currentTime);
                    if (!isNaN(duration)) {
                        videoDuration = formatSecondsToTime(duration);
                        realTimePercentage = ((currentTime / duration) * 100).toFixed(2) + "%";
                    }

                    // Update watched time and calculate remaining time
                    const updatedWatchedTime = addTime(watchedTime, formatSecondsToTime(currentTime));
                    const remainingTime = subtractTime(totalTime, updatedWatchedTime);
                    const percentageWatched = calculatePercentage(updatedWatchedTime, totalTime);

                    // Update the span with the new information
                    span.innerText = `总长：${totalTime}\n已看：${updatedWatchedTime}\n剩余：${remainingTime}\n已看占比：${percentageWatched}\n实时进度：${currentFormatted} / ${videoDuration}`;
                }
            };

            video.addEventListener("timeupdate", videoEventListener);  // Listen for time updates on the video
        }
    }

    // 4. 事件绑定逻辑
    let isVisible = false;  // Track if the info display is visible

    // Event listener for the icon click
    iconContainer.addEventListener("click", function() {
        if (isVisible) {
            span.innerText = "";  // If visible, clear the span
            removeVideoTimeMonitor();  // Stop monitoring the video
        } else {
            update_time_info();  // Update and show time info
            monitorVideoTime();   // Start monitoring the video
        }
        isVisible = !isVisible;  // Toggle visibility state
    });



    // Remove the time update event listener from the video
    function removeVideoTimeMonitor() {
        const video = document.querySelector("video");
        if (video && videoEventListener) {
            video.removeEventListener("timeupdate", videoEventListener);
            videoEventListener = null;  // Reset the listener
        }
    }


    // 5. MutationObserver 监听器
    // Use MutationObserver to watch for DOM changes (for video collections) and refresh data
    const observer = new MutationObserver(() => {

        var targetElement = document.querySelector(".multi-page-v1");
        if (!targetElement) {
            console.log("Target element not found. Stopping script.");
            span.innerText = "";
            removeVideoTimeMonitor();
            iconContainer.style.display = "none";

        } else{
            console.log("Target element found. Restarting script.");
            iconContainer.style.display = "block";
            if(isVisible){
                update_time_info();
                monitorVideoTime();
            }
        }

    });

    // Configure MutationObserver to monitor child node changes and attribute changes
    var targetElementParent = document.querySelector(".right-container-inner");
    observer.observe(targetElementParent, { childList: true, subtree: true });



})();
