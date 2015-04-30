(function() {
    // Note that _currentScript is a web components polyfill convention
    var currentScript = document._currentScript || document.currentScript,
        importDoc = currentScript.ownerDocument,

        fire = function (node, type) {
            var event = new CustomEvent(type, {
                    bubbles: true,
                    cancelable: true
                });
            node.dispatchEvent(event);
        },

        loadParams = function(root) {
            setupVideo(this, root, {
                hideBranding: this.hasAttribute('hide-branding'),
                height: this.getAttribute('height'),
                width: this.getAttribute('width'),
                url: this.getAttribute('url')
            })
        },

        setupVideo = function(api, root, info) {
            var iframe = root.querySelector('iframe'),
                container = root.querySelector('#container');

            if (info.height) {
                container.style.height = info.height + 'px';
                iframe.setAttribute('height', info.height);
            }

            if (info.width) {
                container.style.width = info.width + 'px';
                iframe.setAttribute('width', info.width);
            }

            if (info.url.indexOf('vimeo.com') > 0) {
                setupVimeo(api, info, iframe);
            }
            else {
                setupYoutube(api, info, iframe);
            }
        },

        setupYoutube = function(api, info, iframe) {
            api._playerType = 'youtube';

            api._player = new Promise(function(resolve, reject) {
                var player,

                    onPlayerReady = function() {
                        fire(api, 'ready');
                        resolve(player);
                    },

                    onApiReady = function() {
                        player = new YT.Player(iframe, {
                            events: {
                                'onReady': onPlayerReady
                            }
                        });
                    };

                if (info.hideBranding) {
                    iframe.setAttribute('src', info.url + '?enablejsapi=1&modestbranding=1&controls=0&showinfo=0');
                }
                else {
                    iframe.setAttribute('src', info.url + '?enablejsapi=1');
                }

                if (!window.onYouTubeIframeAPIReady) {
                    window.onYouTubeIframeAPIReady = function() {
                        window.youTubeIframeApiReady = true;
                        onApiReady();
                    };

                    var tag = document.createElement('script');
                    tag.src = "http://www.youtube.com/iframe_api";
                    iframe.parentNode.insertBefore(tag, iframe);
                }
                else if (!window.youTubeIframeApiReady) {
                    var oldReadyCallback = window.onYouTubeIframeAPIReady;
                    window.onYouTubeIframeAPIReady = function() {
                        oldReadyCallback();
                        onApiReady();
                    };
                }
                else {
                    onApiReady();
                }
            });
        },

        setupVimeo = function(api, info, iframe) {
            api._playerType = 'vimeo';

            iframe.setAttribute('src', info.url + '?api=1&player_id=' + iframe.id);

            if (info.hideBranding) {
                iframe.setAttribute('badge', '0');
            }

            api._player = new Promise(function(resolve, reject) {
                var player = $f(iframe);
                player.addEvent('ready', function() {
                    fire(api, 'ready');
                    resolve(player);
                });
            });
        };

    document.registerElement('video-embed', {
        prototype: Object.create(HTMLElement.prototype, {
            attributeChangedCallback: {
                value: function(attrName) {
                    // TODO Respond to other attribute changes too?
                    if (attrName === 'url') {
                        loadParams.call(this, this.shadowRoot);
                    }
                }
            },

            createdCallback: {
                value: function() {
                    var template = importDoc.querySelector('#video-embed-template'),
                        clone = document.importNode(template.content, true),
                        root = this.createShadowRoot();

                    root.appendChild(clone);

                    if (this.hasAttribute('url')) {
                        loadParams.call(this, root);
                    }
                }
            },

            getCurrentTime: {
                value: function() {
                    var videoEmbed = this;
                    return new Promise(function(resolve) {
                        videoEmbed._player.then(function(player) {
                            if (videoEmbed.playerType === 'youtube') {
                                resolve(player.getCurrentTime());
                            }
                            else {
                                player.api('getCurrentTime', function(time) {
                                    resolve(time);
                                });
                            }
                        });
                    });
                }
            },

            pause: {
                value: function() {
                    var videoEmbed = this;
                    return new Promise(function(resolve) {
                        videoEmbed._player.then(function(player) {
                            if (videoEmbed.playerType === 'youtube') {
                                player.addEventListener('onStateChange', function() {
                                    if (player.getPlayerState() === 2) {
                                        resolve();
                                    }
                                });
                                player.pauseVideo();
                            }
                            else {
                                player.addEvent('pause', resolve);
                                player.api('pause');
                            }
                        });
                    });
                }
            },

            play: {
                value: function() {
                    var videoEmbed = this;
                    return new Promise(function(resolve) {
                        videoEmbed._player.then(function(player) {
                            if (videoEmbed.playerType === 'youtube') {
                                player.addEventListener('onStateChange', function() {
                                    if (player.getPlayerState() === 1) {
                                        resolve();
                                    }
                                });
                                player.playVideo();
                            }
                            else {
                                player.addEvent('play', resolve);
                                player.api('play');
                            }
                        });
                    });
                }
            },

            playerType: {
                get: function() {
                    return this._playerType;
                }
            }
        })
    });
}());
