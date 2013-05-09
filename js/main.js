;(function ($, window, document, undefined) {

})(jQuery, window, document);


// jQuery document ready
jQuery.fn.ready(function() {
    $d = $(this);
    
    // yeahh
    my_button_jquery($d);
});

function my_button_jquery(scope){
    scope.find('.yeahh').on('click', function(){
        console.log("Clicou no yeahhh!!!");
    });
}
