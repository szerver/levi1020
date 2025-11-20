/**
 * Custom JavaScript for Elementor Webinar Landing Page
 *
 * Add this to: Appearance > Customize > Additional CSS (in a <script> tag)
 * Or enqueue via your theme's functions.php
 */

(function($) {
  'use strict';

  // Wait for document to be ready
  $(document).ready(function() {

    // ========================================
    // SMOOTH SCROLL TO REGISTRATION FORM
    // ========================================

    /**
     * Smooth scroll to registration form when CTA buttons are clicked
     */
    $('a[href*="#registration"]').on('click', function(e) {
      e.preventDefault();

      var target = $(this).attr('href');
      var $target = $(target);

      if ($target.length) {
        $('html, body').animate({
          scrollTop: $target.offset().top - 80 // 80px offset for fixed header
        }, 800, 'swing');
      }
    });


    // ========================================
    // FORM VALIDATION ENHANCEMENT
    // ========================================

    /**
     * Enhanced form validation with real-time feedback
     */
    $('.elementor-field-group input[type="email"]').on('blur', function() {
      var email = $(this).val();
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email && !emailRegex.test(email)) {
        $(this).addClass('invalid-email');
        if (!$(this).next('.error-message').length) {
          $(this).after('<span class="error-message" style="color: #D32F2F; font-size: 12px; margin-top: 5px; display: block;">Please enter a valid email address</span>');
        }
      } else {
        $(this).removeClass('invalid-email');
        $(this).next('.error-message').remove();
      }
    });

    /**
     * Phone number formatting (US format)
     */
    $('.elementor-field-group input[type="tel"]').on('input', function() {
      var number = $(this).val().replace(/\D/g, '');
      var formatted = '';

      if (number.length > 0) {
        if (number.length <= 3) {
          formatted = '(' + number;
        } else if (number.length <= 6) {
          formatted = '(' + number.slice(0, 3) + ') ' + number.slice(3);
        } else {
          formatted = '(' + number.slice(0, 3) + ') ' + number.slice(3, 6) + '-' + number.slice(6, 10);
        }
        $(this).val(formatted);
      }
    });


    // ========================================
    // COUNTDOWN TIMER ENHANCEMENT
    // ========================================

    /**
     * Custom countdown timer with localStorage for persistence
     */
    function initCountdown(targetDate) {
      var countdownElement = $('.elementor-countdown-wrapper');

      if (!countdownElement.length) return;

      function updateCountdown() {
        var now = new Date().getTime();
        var distance = new Date(targetDate).getTime() - now;

        if (distance < 0) {
          $('.elementor-countdown-wrapper').html(
            '<div style="text-align: center; color: #FF6B6B; font-size: 24px; font-weight: 700;">Webinar is Live!</div>'
          );
          return;
        }

        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update countdown digits if Elementor countdown exists
        $('.elementor-countdown-item').each(function() {
          var type = $(this).data('type');
          var value;

          switch(type) {
            case 'days': value = days; break;
            case 'hours': value = hours; break;
            case 'minutes': value = minutes; break;
            case 'seconds': value = seconds; break;
          }

          $(this).find('.elementor-countdown-digits').text(value);
        });
      }

      // Update every second
      setInterval(updateCountdown, 1000);
      updateCountdown(); // Initial call
    }

    // Initialize countdown (set your webinar date here)
    // Format: 'YYYY-MM-DD HH:MM:SS'
    var webinarDate = '2024-03-25 14:00:00';
    initCountdown(webinarDate);


    // ========================================
    // REGISTRATION TRACKING
    // ========================================

    /**
     * Track registration attempts and send to analytics
     */
    $('.elementor-form').on('submit', function(e) {
      var formData = $(this).serializeArray();
      var userData = {};

      formData.forEach(function(field) {
        userData[field.name] = field.value;
      });

      // Google Analytics event tracking (if GA is loaded)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'registration_submit', {
          'event_category': 'Webinar',
          'event_label': 'Registration Form',
          'value': 1
        });
      }

      // Facebook Pixel event (if FB Pixel is loaded)
      if (typeof fbq !== 'undefined') {
        fbq('track', 'CompleteRegistration', {
          content_name: 'Webinar Registration',
          status: 'completed'
        });
      }

      // Store in localStorage
      localStorage.setItem('webinarRegistration', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: userData
      }));
    });


    // ========================================
    // STICKY HEADER CTA
    // ========================================

    /**
     * Show sticky CTA bar after user scrolls past hero section
     */
    function initStickyCTA() {
      var stickyBar = $('<div class="sticky-cta-bar" style="display: none;">' +
        '<div class="container" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px;">' +
          '<div style="color: white; font-weight: 600;">Master Digital Marketing - Free Webinar</div>' +
          '<a href="#registration-form" class="sticky-cta-button" style="background: white; color: #FF6B6B; padding: 10px 30px; border-radius: 25px; text-decoration: none; font-weight: 700;">Register Now</a>' +
        '</div>' +
      '</div>');

      stickyBar.css({
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'right': '0',
        'background': 'linear-gradient(135deg, #4158D0, #C850C0)',
        'z-index': '9999',
        'box-shadow': '0 2px 10px rgba(0,0,0,0.2)',
        'transition': 'transform 0.3s ease'
      });

      $('body').prepend(stickyBar);

      $(window).on('scroll', function() {
        var scrollTop = $(window).scrollTop();
        var heroHeight = $('.elementor-section').first().outerHeight();

        if (scrollTop > heroHeight) {
          stickyBar.slideDown(300);
        } else {
          stickyBar.slideUp(300);
        }
      });
    }

    // Uncomment to enable sticky CTA bar
    // initStickyCTA();


    // ========================================
    // EXIT INTENT POPUP
    // ========================================

    /**
     * Show exit intent popup to capture abandoning visitors
     */
    function initExitIntent() {
      var hasShown = sessionStorage.getItem('exitIntentShown');

      if (hasShown) return;

      var exitPopup = $('<div class="exit-intent-popup" style="display: none;">' +
        '<div class="exit-popup-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 99998;"></div>' +
        '<div class="exit-popup-content" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 40px; border-radius: 10px; max-width: 500px; width: 90%; z-index: 99999; box-shadow: 0 10px 50px rgba(0,0,0,0.3);">' +
          '<button class="close-popup" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>' +
          '<h2 style="color: #2C3E50; margin-bottom: 15px;">Wait! Don\'t Miss Out!</h2>' +
          '<p style="color: #7F8C8D; margin-bottom: 20px;">Join thousands of marketers who are transforming their business. Register now and get exclusive bonuses worth $297!</p>' +
          '<a href="#registration-form" class="exit-popup-cta" style="display: inline-block; background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: 700;">Yes, I Want to Register!</a>' +
        '</div>' +
      '</div>');

      $('body').append(exitPopup);

      // Detect exit intent (mouse leaving viewport at top)
      $(document).on('mouseleave', function(e) {
        if (e.clientY < 50 && !hasShown) {
          exitPopup.fadeIn(300);
          sessionStorage.setItem('exitIntentShown', 'true');
        }
      });

      // Close popup
      $('.close-popup, .exit-popup-overlay, .exit-popup-cta').on('click', function() {
        exitPopup.fadeOut(300);
      });
    }

    // Uncomment to enable exit intent popup
    // initExitIntent();


    // ========================================
    // SOCIAL PROOF NOTIFICATIONS
    // ========================================

    /**
     * Show fake social proof notifications (recent registrations)
     */
    function initSocialProof() {
      var names = [
        'Sarah from New York',
        'Michael from Los Angeles',
        'Emma from Chicago',
        'David from Houston',
        'Jessica from Phoenix',
        'James from Philadelphia',
        'Emily from San Antonio',
        'Daniel from San Diego',
        'Sophia from Dallas',
        'Matthew from San Jose'
      ];

      function showNotification() {
        var randomName = names[Math.floor(Math.random() * names.length)];
        var minutesAgo = Math.floor(Math.random() * 15) + 1;

        var notification = $('<div class="social-proof-notification">' +
          '<div class="notification-icon" style="background: #27AE60; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">✓</div>' +
          '<div class="notification-text" style="margin-left: 15px;">' +
            '<div style="font-weight: 600; color: #2C3E50;">' + randomName + '</div>' +
            '<div style="font-size: 12px; color: #7F8C8D;">Registered ' + minutesAgo + ' minutes ago</div>' +
          '</div>' +
        '</div>');

        notification.css({
          'position': 'fixed',
          'bottom': '20px',
          'left': '20px',
          'background': 'white',
          'padding': '15px 20px',
          'border-radius': '10px',
          'box-shadow': '0 4px 20px rgba(0,0,0,0.15)',
          'display': 'flex',
          'align-items': 'center',
          'z-index': '9997',
          'transform': 'translateX(-400px)',
          'transition': 'transform 0.3s ease'
        });

        $('body').append(notification);

        // Slide in
        setTimeout(function() {
          notification.css('transform', 'translateX(0)');
        }, 100);

        // Slide out and remove
        setTimeout(function() {
          notification.css('transform', 'translateX(-400px)');
          setTimeout(function() {
            notification.remove();
          }, 300);
        }, 5000);
      }

      // Show notification every 15-30 seconds
      setInterval(function() {
        if (Math.random() > 0.3) { // 70% chance to show
          showNotification();
        }
      }, Math.random() * 15000 + 15000);
    }

    // Uncomment to enable social proof notifications
    // initSocialProof();


    // ========================================
    // ATTENDEE COUNTER
    // ========================================

    /**
     * Animated attendee counter
     */
    function initAttendeeCounter() {
      var counter = $('.attendee-counter');

      if (!counter.length) return;

      var startCount = 4850;
      var endCount = 5000;
      var duration = 2000;
      var increment = (endCount - startCount) / (duration / 50);
      var current = startCount;

      var interval = setInterval(function() {
        current += increment;
        if (current >= endCount) {
          current = endCount;
          clearInterval(interval);
        }
        counter.text(Math.floor(current).toLocaleString());
      }, 50);

      // Slowly increment over time
      setInterval(function() {
        endCount += Math.floor(Math.random() * 3);
        counter.text(endCount.toLocaleString());
      }, 10000);
    }

    initAttendeeCounter();


    // ========================================
    // LAZY LOAD VIDEOS
    // ========================================

    /**
     * Lazy load YouTube/Vimeo embeds on click
     */
    $('.video-placeholder').on('click', function() {
      var videoUrl = $(this).data('video-url');
      var iframe = $('<iframe>', {
        src: videoUrl + '?autoplay=1',
        frameborder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: true,
        style: 'width: 100%; height: 100%; position: absolute; top: 0; left: 0;'
      });

      $(this).html(iframe);
    });


    // ========================================
    // FAQ AUTO-EXPAND ON HASH
    // ========================================

    /**
     * Auto-expand FAQ item if hash matches
     */
    if (window.location.hash) {
      var hash = window.location.hash;
      var $target = $(hash);

      if ($target.hasClass('elementor-tab-title')) {
        $target.trigger('click');
        setTimeout(function() {
          $('html, body').animate({
            scrollTop: $target.offset().top - 100
          }, 500);
        }, 300);
      }
    }


    // ========================================
    // FORM AUTO-FILL FROM URL PARAMETERS
    // ========================================

    /**
     * Auto-fill form from URL parameters (e.g., ?email=test@example.com)
     */
    function autoFillForm() {
      var urlParams = new URLSearchParams(window.location.search);

      urlParams.forEach(function(value, key) {
        var $field = $('input[name="' + key + '"], textarea[name="' + key + '"]');
        if ($field.length) {
          $field.val(decodeURIComponent(value));
        }
      });
    }

    autoFillForm();


    // ========================================
    // WEBINAR TIMEZONE DETECTOR
    // ========================================

    /**
     * Detect user's timezone and display webinar time accordingly
     */
    function detectTimezone() {
      var userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var webinarDate = new Date('2024-03-25T14:00:00-05:00'); // EST

      var timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: userTimezone
      };

      var localTime = webinarDate.toLocaleTimeString('en-US', timeOptions);

      $('.user-timezone-time').text(localTime);
    }

    detectTimezone();


    // ========================================
    // ACCESSIBILITY ENHANCEMENTS
    // ========================================

    /**
     * Keyboard navigation for custom elements
     */
    $('.custom-clickable').on('keypress', function(e) {
      if (e.which === 13 || e.which === 32) { // Enter or Space
        e.preventDefault();
        $(this).trigger('click');
      }
    });

    /**
     * Focus management for modals
     */
    $('.modal').on('shown', function() {
      $(this).find('input:first').focus();
    });


    // ========================================
    // PERFORMANCE OPTIMIZATIONS
    // ========================================

    /**
     * Debounce scroll events
     */
    function debounce(func, wait) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          func.apply(context, args);
        }, wait);
      };
    }

    // Use debounced scroll
    $(window).on('scroll', debounce(function() {
      // Your scroll handler code here
    }, 100));


    // ========================================
    // DEVELOPMENT HELPERS
    // ========================================

    /**
     * Console log for debugging (remove in production)
     */
    console.log('Webinar Page Scripts Loaded');
    console.log('Registration Form:', $('.elementor-form').length ? 'Found' : 'Not Found');
    console.log('Countdown Timer:', $('.elementor-countdown-wrapper').length ? 'Found' : 'Not Found');

  }); // End document ready

})(jQuery);


// ========================================
// VANILLA JS FUNCTIONS (No jQuery required)
// ========================================

/**
 * Add calendar event (.ics file download)
 */
function addToCalendar(eventTitle, eventDescription, eventLocation, startDate, endDate) {
  var icsContent =
    'BEGIN:VCALENDAR\n' +
    'VERSION:2.0\n' +
    'BEGIN:VEVENT\n' +
    'DTSTART:' + formatICSDate(startDate) + '\n' +
    'DTEND:' + formatICSDate(endDate) + '\n' +
    'SUMMARY:' + eventTitle + '\n' +
    'DESCRIPTION:' + eventDescription + '\n' +
    'LOCATION:' + eventLocation + '\n' +
    'END:VEVENT\n' +
    'END:VCALENDAR';

  var blob = new Blob([icsContent], { type: 'text/calendar' });
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'webinar.ics';
  link.click();
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Share to social media
 */
function shareToSocial(platform) {
  var url = encodeURIComponent(window.location.href);
  var title = encodeURIComponent('Join me for this amazing webinar!');
  var shareUrl;

  switch(platform) {
    case 'facebook':
      shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
      break;
    case 'twitter':
      shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
      break;
    case 'linkedin':
      shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
      break;
    case 'email':
      shareUrl = 'mailto:?subject=' + title + '&body=' + url;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

/**
 * Copy registration link to clipboard
 */
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      alert('Link copied to clipboard!');
    });
  } else {
    // Fallback for older browsers
    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Link copied to clipboard!');
  }
}
