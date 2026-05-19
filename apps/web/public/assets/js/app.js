"use strict";

class App {
    constructor() {
        this.initControls = () => {

            function exitHandler() {
                if (
                    !document.webkitIsFullScreen &&
                    !document.mozFullScreen &&
                    !document.msFullscreenElement
                ) {
                    $("body").removeClass("fullscreen-enable");
                }
            }

            $('[data-toggle="fullscreen"]').on("click", function (e) {
                e.preventDefault();

                $("body").toggleClass("fullscreen-enable");

                if (
                    document.fullscreenElement ||
                    document.mozFullScreenElement ||
                    document.webkitFullscreenElement
                ) {
                    if (document.cancelFullScreen) {
                        document.cancelFullScreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    }
                } else {
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    } else if (document.documentElement.mozRequestFullScreen) {
                        document.documentElement.mozRequestFullScreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                        document.documentElement.webkitRequestFullscreen(
                            Element.ALLOW_KEYBOARD_INPUT
                        );
                    }
                }
            });

            document.addEventListener("fullscreenchange", exitHandler);
            document.addEventListener("webkitfullscreenchange", exitHandler);
            document.addEventListener("mozfullscreenchange", exitHandler);
        };
    }

    initComponents(container = document) {
        // Waves effect
        Waves.init();

        // Feather icons
        feather.replace();

        // Bootstrap Popover
        document
            .querySelectorAll('[data-bs-toggle="popover"]')
            .forEach(el => new bootstrap.Popover(el));

        // Bootstrap Tooltip
        container
            .querySelectorAll('[data-bs-toggle="tooltip"]')
            .forEach(el => {

                const existing = bootstrap.Tooltip.getInstance(el);

                if (existing) {
                    existing.dispose();
                }

                new bootstrap.Tooltip(el);
            });

        // Bootstrap Toast
        document
            .querySelectorAll(".toast")
            .forEach(el => new bootstrap.Toast(el));

        // Toast placement selector
        const toast = document.getElementById("toastPlacement");
        if (toast) {
            document
                .getElementById("selectToastPlacement")
                .addEventListener("change", function () {
                    if (!toast.dataset.originalClass) {
                        toast.dataset.originalClass = toast.className;
                    }

                    toast.className =
                        toast.dataset.originalClass + " " + this.value;
                });
        }

        // Live alert
        const alertPlaceholder = document.getElementById("liveAlertPlaceholder");
        const alertBtn = document.getElementById("liveAlertBtn");

        if (alertBtn) {
            alertBtn.addEventListener("click", function () {
                const message = "Nice, you triggered this alert message!";
                const type = "primary";

                const wrapper = document.createElement("div");
                wrapper.innerHTML = `
                    <div class="alert alert-${type} alert-dismissible" role="alert">
                        ${message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;

                alertPlaceholder.append(wrapper);
            });
        }
    }

    disposeComponents(container = document) {
        // Tooltip
        container
            .querySelectorAll('[data-bs-toggle="tooltip"]')
            .forEach(el => {
                bootstrap.Tooltip.getInstance(el)?.dispose();
            });
    }

    initMenu() {
        const body = document.body;
        let toggleBtn = document.querySelector(".button-toggle-menu");

        // Toggle sidebar
        if (toggleBtn) {
            toggleBtn.addEventListener("click", function () {
                if (body.getAttribute("data-sidebar") === "default") {
                    body.setAttribute("data-sidebar", "hidden");
                } else {
                    body.setAttribute("data-sidebar", "default");
                }
            });
        }

        // Responsive sidebar
        const handleResize = () => {
            if (window.innerWidth < 1040) {
                body.setAttribute("data-sidebar", "hidden");
            } else {
                body.setAttribute("data-sidebar", "default");
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        // Sidebar menu behavior
        if ($("#side-menu").length) {
            $("#side-menu li .collapse").on("show.bs.collapse", function (e) {
                const parent = $(e.target).parents(".collapse.show");
                $("#side-menu .collapse.show").not(parent).collapse("hide");
            });

            $("#side-menu a").each(function () {
                const currentUrl = window.location.href.split(/[?#]/)[0];

                if (this.href === currentUrl) {
                    $(this).addClass("active");
                    $(this).parent().addClass("menuitem-active");

                    let parent = $(this).parent().parent().parent();
                    parent.addClass("show");

                    parent.parent().addClass("menuitem-active");

                    let el = parent.parent().parent().parent().parent().parent();

                    if (el.attr("id") !== "sidebar-menu") {
                        el.addClass("show");
                    }

                    el.parent().addClass("menuitem-active");

                    let wrapper = el.parent().parent().parent();

                    if (wrapper.attr("id") !== "wrapper") {
                        wrapper.addClass("show");
                    }

                    let bodyParent = wrapper.parent();

                    if (!bodyParent.is("body")) {
                        bodyParent.addClass("menuitem-active");
                    }
                }
            });
        }
    }

    init() {
        this.initComponents();
        this.initMenu();
        this.initControls();
    }
}

// Run app
window.App = new App();
window.App.init();