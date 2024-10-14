// ==UserScript==
// @name         bilibili_videos_timer
// @namespace    https://github.com/Peilin-zzz-Eric/bilibili_videos_timer
// @version      0.3
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

    // 1. Time processing related functions
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


    // 2. DOM related operations
    // Create and style the container for the icon
    const iconContainer = document.createElement("div");
    iconContainer.style.position = "fixed";
    iconContainer.style.bottom = "250px";
    iconContainer.style.left = "20px";
    iconContainer.style.padding = "0px";
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


    // 3. Update and monitor video playback progress logic
    let totalTime = "0:0:0";  // Total time of the video collection
    let watchedTime = "0:0:0";  // Time already watched

    // Utility function to get element by XPath
    function getElementsByXPath(parent, xpath) {
        let elements = [];
        const result = document.evaluate(xpath, parent, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < result.snapshotLength; i++) {
            elements.push(result.snapshotItem(i));  // Add all matched elements to the array
        }
        return elements;
    }

    function getElementByXPath(parent, xpath) {
        const result = document.evaluate(xpath, parent, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    }

    // Update the total and watched time information
    function update_time_info() {
        let elements = [];
        const Dom_1 = document.getElementById("multi_page");
        const Dom_2 = document.getElementsByClassName("video-section-list");

        // If using the structure DOM_1
        if (Dom_1) {
            const xpathExpression = "//*[@id='multi_page']//ul[@class='list-box']/li";
            elements = getElementsByXPath(document, xpathExpression);

        }else if (Dom_2) {
            // If using the new structure DOM_2
            const xpathExpression = "//*[contains(@class, 'video-section-list')]/div[contains(@class, 'video-episode-card')]/div[contains(@class, 'video-episode-card__info')]";
            elements = getElementsByXPath(document, xpathExpression);

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
                }else if (Dom_2) {
                    str = getElementByXPath(childElement, ".//div[@class='video-episode-card__info-duration']").innerText;

                }
                let str_arr = str.split(":");
                if (str_arr.length == 2) str = "0:" + str;  // Convert "mm:ss" format to "hh:mm:ss"
                if (str_arr.length == 1) str = "0:0:" + str;  // Convert "ss" format to "hh:mm:ss"

                date = addTime(date, str);  // Add the duration to the total time


                // Check if this is the currently playing video
                if (childElement.classList.contains("on") || childElement.classList.contains("video-episode-card__info-playing")) {
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

            // Display the information in the span
            var time_info = `总长：${totalTime}\n已看：${watchedTime}\n剩余：${remainingTime}\n已看占比：${percentageWatched}\n实时进度：${currentTime} / ${videoDuration}`;
            span.innerText = time_info;
        }
    }


    let videoEventListener = null;  // Store event listener for video time updates

    // Update video time information based on current video state
    function monitorVideoTime() {
        const video = document.querySelector("video");
        if (video && !videoEventListener){
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
                    if (video.ended) {
                        removeVideoTimeMonitor();  // Remove listener
                        console.log("Video ended, listener removed.");
                    } else {
                        // Otherwise continue updating span.innerText
                        span.innerText = `总长：${totalTime}\n已看：${updatedWatchedTime}\n剩余：${remainingTime}\n已看占比：${percentageWatched}\n实时进度：${currentFormatted} / ${videoDuration}`;
                        span.innerText = time_info;
                    }
                }
            };
            video.addEventListener("timeupdate", videoEventListener);  // Listen for time updates on the video
        }
    }


    // 4. Event binding logic
    let isVisible = false;  // Track if the info display is visible

    // Event listener for the icon click
    iconContainer.addEventListener("click", function() {
        if (isVisible) {
            // If visible, clear the span and stop monitoring the video
            span.innerText = "";
            removeVideoTimeMonitor();
        } else {
            // Update and show time info
            update_time_info();
            monitorVideoTime();
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



    // 5. MutationObserver listener
    // Use MutationObserver to watch for DOM changes (for video collections) and refresh data
    const observer = new MutationObserver((mutationsList) => {
        let multi_list = document.querySelector(".multi-page-v1");
        let video_section_list = document.querySelector(".video-section-list.section-0");
        let targetElement = multi_list || video_section_list;

        if (!targetElement) {
            console.log("Target element not found. Stopping script.");
            span.innerText = "";
            removeVideoTimeMonitor();
            removeVideoEndMonitor();
            iconContainer.style.display = "none";

        } else {
            console.log("Target element found. Restarting script.");
            iconContainer.style.display = "block";

            // When isVisible is true and targetElement has changed
            if (isVisible) {
                let targetElementChanged = false;

                // Iterate over the MutationObserver mutationsList
                mutationsList.forEach((mutation) => {

                    // Check for attribute changes, particularly class changes
                    if (mutation.type === "attributes" && mutation.attributeName === "class") {
                        const targetNode = mutation.target;

                        // Check if targetNode is a child of targetElement and its class has changed
                        if (targetElement.contains(targetNode) && (targetNode.tagName === 'LI' || targetNode.classList.contains("video-episode-card__info"))) {
                            if(targetNode.classList.contains("on") || targetNode.classList.contains("video-episode-card__info-playing")){
                                targetElementChanged = true;
                            }
                        }
                    }
                });

                if (targetElementChanged) {
                    update_time_info();
                    monitorVideoTime();
                    console.log("Target element has changed.");
                }
            }
        }
    });

    // Configure MutationObserver to monitor child node changes and attribute changes
    var targetElementParent = document.querySelector(".right-container-inner");
    observer.observe(targetElementParent, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });



})();
