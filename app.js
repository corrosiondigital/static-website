/**
 *    (c) 2009-2014 Demandware Inc.
 *    Subject to standard usage terms and conditions
 *    For all details and documentation:
 *    https://bitbucket.com/demandware/sitegenesis
 */

'use strict';

var $ = require('jquery');
var cookies = require('./cookie');
var countries = require('./countries');
var mobilemenu = require('./mobilemenu');
var cq = require('./cq');
var minicart = require('./minicart');
var page = require('./page');
var breadcrumbs = require('./breadcrumbs');
var flyin = require('./flyin');
var flyinscrolling = require('./flyinscrolling');
var searchinputfield = require('./search/searchinputfield');
var inputfields = require('./inputfields');
var scrolledpage = require('./scrolledpage');
var smoothscrolling = require('./smoothscrolling');
var util = require('./util');
var validator = require('./validator');
var uniform = require('./components/uniform');
var carousel = require('./carousel');
var newsletterfooter = require('./newsletterfooter');
var newsletteraccount = require('./newsletteraccount');
var tabNavigation = require('./tab-navigation');
var teaser = require('./teaser');
var toggle = require('./toggle');
var tracking = require('./tracking');
var footbed = require('./footbed');
var pdpsize = require('./pdpsize');
var header = require('./header');
var showpassword = require('./showpassword');
var emojiremove = require('./emojiremove');
var progressbar = require('./progressbar');
var videovimeo = require('./videovimeo');
var lazyload = require('./lazyload');
var lazyloadcss = require('./lazyloadcss');
var cookieprivacy = require('./cookieprivacy');
var privacy = require('./privacy');
var privacyOverlay = require('./privacy-overlay');


var pages;
var app;

require('../static/default/lib/picturefill.min.js');
require('./jquery-ext')();
require('./ie9warning')();
require('./videojs')();
require('inobounce'); // BSDDEV-327 fix scrolling on iOS devices, patch at module needed -> see Webpack config

function initCookiePrivacy () {
    if (SitePreferences.ENABLE_COOKIE_RESTRICTION) {
        privacy.initPrivacySwitches();
        privacyOverlay.initPrivacyOverlay();
    } else {
        cookieprivacy();
    }
}

function initializeEvents() {
    var controlKeys = ['8', '13', '46', '45', '36', '35', '38', '37', '40', '39'];
    var $subscribeEmail;

    $('body')
        .on('keydown', 'textarea[data-character-limit]', function (e) {
            var text = $.trim($(this).val());
            var charsLimit = $(this).data('character-limit');
            var charsUsed = text.length;

            if ((charsUsed >= charsLimit) && (controlKeys.indexOf(e.which.toString()) < 0)) {
                e.preventDefault();
            }
        })
        .on('change keyup mouseup', 'textarea[data-character-limit]', function () {
            var text = $.trim($(this).val());
            var charsLimit = $(this).data('character-limit');
            var charsUsed = text.length;
            var charsRemain = charsLimit - charsUsed;

            if (charsRemain < 0) {
                $(this).val(text.slice(0, charsRemain));
                charsRemain = 0;
            }

            $(this).next('div.char-count').find('.char-remain-count').html(charsRemain);
        });

    // remove unused content areas
    $('.module-rebrush-grey').each(function () {
        if ($(this).children('.module-rebrush-inner').children().length === 0) {
            $(this).hide();
        }
    });

    // add show/hide navigation elements
    $('.secondary-navigation .toggle').click(function () {
        $(this).toggleClass('expanded').next('ul').toggle();
    });

    // add generic tab navigation functionality
    tabNavigation.init();

    // add generic toggle functionality
    toggle.init();

    // add generic teaser toggle functionality
    teaser.init();

    // subscribe email box
    $subscribeEmail = $('.subscribe-email');
    if ($subscribeEmail.length > 0) {
        $subscribeEmail.focus(function () {
            var $val = $(this.val());
            if ($val.length > 0 && $val !== Resources.SUBSCRIBE_EMAIL_DEFAULT) {
                return; // do not animate when contains non-default value
            }

            $(this).animate({ color: '#999999' }, 500, 'linear', function () {
                $(this).val('').css('color', '#333333');
            });
        }).blur(function () {
            var val = $.trim($(this.val()));
            if (val.length > 0) {
                return; // do not animate when contains value
            }
            $(this).val(Resources.SUBSCRIBE_EMAIL_DEFAULT)
                .css('color', '#999999')
                .animate({ color: '#333333' }, 500, 'linear');
        });
    }

    // main menu toggle
    $('.menu-toggle').on('click', function () {
        $('#wrapper').toggleClass('menu-active');
    });

    $('.menu-category li .menu-item-toggle').on('click', function (e) {
        var $parentLi = $(e.target).closest('li');
        e.preventDefault();
        $parentLi.siblings('li').removeClass('active').find('.menu-item-toggle').removeClass('fa-chevron-up active')
            .addClass('fa-chevron-right');
        $parentLi.toggleClass('active');
        $(e.target).toggleClass('fa-chevron-right fa-chevron-up active');
    });

    // set cookie and use this cookie to show/hide very-top-infobanner
    $('.very-infobanner-hide-button button').on('click', function () {
        var $mainWrapper = $('.main-wrapper');
        var $HeaderWrapper = $('.header-wrapper');
        $('.very-infobanner-wrapper').hide();
        $mainWrapper.css('padding-top', $HeaderWrapper.outerHeight());
        cookies.set('dwHideVeryTopInfobanner', true, { path: '/', expires: 30 });
    });

    mobilemenu.ajaxInit();
    header.init();
    breadcrumbs.init();
    tracking.init();

    // Using for content asset find-store
    $('.content-find-store-input input').on('blur', function () {
        if ($(this).val() === '') {
            $('.content-find-store-input .error').show();
        }
    });
    // Using for content asset find-store
    $('.content-find-store-input input').on('keypress', function (e) {
        if (e.which === 13) {
            if ($(this).val() === '') {
                $('.content-find-store-input .error').show();
            } else {
                $('.content-find-store-input .error').hide();
                $('#content-find-store-form').submit();
            }
        } else {
            $('.content-find-store-input .error').hide();
        }
    });
    // Using for content asset find-store
    $('.content-find-store-input span').on('click', function () {
        var $input = $('.content-find-store-input input');
        if ($input.val() === '') {
            $('.content-find-store-input .error').show();
        } else {
            $('.content-find-store-input .error').hide();
            $('#content-find-store-form').submit();
        }
        $('#content-find-store-form').submit();
    });

    // auto complete for japanese zip code and prefection
    $('[data-jpzipcomplete-htmlname]').each(function () {
        require('./jpzipcomplete')($(this));
    });
}

/**
 * Admin can change content of content slot very-top-header-infobanner. So its height is dynamic
 * Calculate height of header-wrapper and set padding for main-wraper
 */
function changeMainWrapperPadding() {
    var $mainWrapper = $('.main-wrapper');
    var $HeaderWrapper = $('.header-wrapper');
    var $infoBannerWrapper = $('.very-infobanner-wrapper');
    var $countryGateway = $('.countrygateway');
    $(window).on('load resize', function () {
        var headerHeight = $HeaderWrapper.outerHeight() - $countryGateway.outerHeight();
        if ($infoBannerWrapper.length) {
            $infoBannerWrapper.css('padding-top', headerHeight);
            $mainWrapper.css('padding-top', 0);
        } else {
            $mainWrapper.css('padding-top', headerHeight);
        }
    });
}

/**
 * @private
 * @function
 * @description Adds class ('js') to html for css targeting and loads js specific styles.
 */
function initializeDom() {
    // add class to html for css targeting
    $('html').addClass('js');
    if (SitePreferences.LISTING_INFINITE_SCROLL) {
        $('html').addClass('infinite-scroll');
    }
    // load js specific styles
    util.limitCharacters();
}

//shoesize.me integration
if ($('.ShoeSizeMe').length) {
    $('.sizes-wrapper input').on('click', function () {
        var scale = this.id.toLowerCase();
        var pid = $('#prodID').val();
        $.get( Urls.shoesizeMePDP + '?scale=' + scale + '&pid=' + pid, function( data ) {
           $('#shoesizeme-wrapper').html(data);
        });
    });
    //integration DE
    document.body.onclick = function(e) {
        if ($('.size-display').length && !($('.size-display').is(':empty'))) {
            $.get( Urls.shoesizeMeUsed, function(data) {console.log(data);});
        }
    }
}
//integration US
$('.US-shoesizeMe').on('click', function () {
    $.get( Urls.shoesizeMeClicked, function(data) {console.log(data);});
});
$('.US-sizewidthtable').on('click', function () {
    $.get( Urls.sizeWidthTableClicked, function(data) {console.log(data);});
});

pages = {
    account: require('./pages/account'),
    login: require('./pages/login'),
    cart: require('./pages/cart'),
    checkout: require('./pages/checkout'),
    // compare: require('./pages/compare'),
    product: require('./pages/product'),
    search: require('./pages/search'),
    storefront: require('./pages/storefront'),
    // wishlist: require('./pages/wishlist'),
    storelocator: require('./pages/storelocator'),
    customerservice: require('./pages/customerservice')
};

app = {
    init: function () {
        var ns;
        if (document.cookie.length === 0) {
            $('<div/>').addClass('no-cookie-message').append($('<div/>').addClass('no-cookie-message-inner')
                .html(Resources.COOKIES_DISABLED)).appendTo('#browser-check');
        }
        if (navigator.userAgent.match(/(iPad|iPhone|iPod)/i)) {
            $('html').addClass('ios');
        }
        initializeDom();
        initializeEvents();

        // init specific global components
        initCookiePrivacy();
        lazyload.init();
        countries.init();
        // tooltip.init();
        scrolledpage.init();
        smoothscrolling.init();
        flyinscrolling.init();
        inputfields.init();
        minicart.init();
        flyin.init();
        searchinputfield.init();
        validator.init();
        cq.init();
        carousel.init();
        newsletterfooter.init();
        newsletteraccount.init();
        footbed.init();
        pdpsize.init();
        showpassword.init();
        emojiremove.init();
        progressbar.init();
        videovimeo.init();
        lazyloadcss.init();
        uniform();
        changeMainWrapperPadding();
        // execute page specific initializations
        $.extend(page, window.pageContext);
        ns = page.ns;
        if (ns && pages[ns] && pages[ns].init) {
            pages[ns].init();
        }
        // needed for Demandware Predictive Recommendations
        window.dwapp = {
            reportRecommendationLoad: function () {
                lazyload.init();
                carousel.init();
            }
        };
    }
};

// enable frontend JS logging
(function () {
    if (clientErrorLogging) {
        require('./logger')(clientErrorLogging);
    }
}());

// general extension functions
(function () {
    String.format = function () {
        var first = 0;
        var str = arguments[first];
        var i;
        var len = arguments.length - 1;
        var reg;
        for (i = 0; i < len; i++) {
            reg = new RegExp('\\{' + i + '\\}', 'gm');
            str = str.replace(reg, arguments[i + 1]);
        }
        return str;
    };
}());

// initialize app
$(function () {
    app.init();
});
