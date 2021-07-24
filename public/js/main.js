$(function () {
    // ------------------------------------------------------- //
    // Multi Level dropdowns
    // ------------------------------------------------------ //
    $("ul.dropdown-menu [data-toggle='dropdown']").on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        $(this).siblings().toggleClass("show");


        if (!$(this).next().hasClass('show')) {
            $(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
        }
        $(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function (e) {
            $('.dropdown-submenu .show').removeClass("show");
        });

    });
});





$(document).ready(function () {
    $('.swift').click(function () {
        var signButton = $(this).html();
        console.log(signButton);
        debugger;
        if (signButton == 'Sign In') {
            document.getElementById('username').required = false;
            document.getElementById('username').removeAttribute("name");
            document.getElementById('signinlogin').setAttribute("action", "/login");
            $('.sign_up').html('Sign In'); // sign up button text change
            $('.sign_in').html('Sign Up'); // sign in button text change
            $('.swift_right').show(); // second logo show
            $('.b-forgot').show(); // forgot option show
            $('.form_title').html('Sign In'); // form title text change
            $('.b-subtext').html('Use Your Registered Email'); // form sub title text change
            $('.user_title').html('Hello'); // user title text change
            $('.user_subTitle').html('Enter your personal details </br> and start journey with us.'); // user sub title text change
            $('.b-title').css('margin-top', '100px'); // user section add margin top in css
            $('.swift_left').hide(); // default logo hide
            $('.username').hide(); // form user field hide
            $('.b-wrapper').addClass('swift_element'); // add reverse
        } else {
            document.getElementById('username').required = false;
            document.getElementById('username').setAttribute("name", "user_name");
            document.getElementById('signinlogin').setAttribute("action", "/register");
            $('.sign_up').html('Sign Up'); // sign up button text change
            $('.sign_in').html('Sign In'); // sign in button text change
            $('.swift_right').hide(); // second logo hide
            $('.b-forgot').hide(); // forgot option hide
            $('.form_title').html('Create Account');
            $('.b-subtext').html('Use Your Email For Registration');
            $('.user_title').html('Welcome');
            $('.user_subTitle').html('To keep Connected with us please </br> login with your personal info.');
            $('.b-title').css('margin-top', '0px');
            $('.swift_left').show();
            $('.username').show();
            $('.b-wrapper').removeClass('swift_element');
        }

    })
})

