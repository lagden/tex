// jQuery document ready
jQuery.fn.ready(function() {
    $d = $(this);
    
    // yeahh
    my_button_jquery($d);

    if(typeof($.fn.isotope) == "function")
    {
        var isOpen = false;
        var $container = $('#blocks');
        var filtro = $container.data('filtro');
        filtro = filtro || false;

        console.log($container);

        $container.imagesLoaded( function(){
            $container.isotope({
                  itemSelector: '.block'
                , itemPositionDataEnabled: true
                , getSortData: {
                    number : function ( elem ) {
                        return parseInt( elem.data('pos'), 10 );
                    }
                }
                , sortBy : 'number'
                , resizable: false
                , masonry: { columnWidth: $container.width() / 5 }
            });
        });

        $container.delegate('.block', 'click', function(ev) {
            $this = $(this);
            $bt = $this.find('> .close:eq(0)');
            if(!isOpen)
            {
                isOpen = true;
                $bt.addClass('show');
                var tl = new TimelineMax();

                tl
                .to($this, .5, {opacity: 1, onComplete: function(){ $this.addClass('large'); } })
                .to($this, .5, {backgroundColor: 'gray', onComplete: relayout, onCompleteParams: [$container], onUpdate: relayout, onUpdateParams: [$container]});
            }
        });

        $('.block').find('> .close:eq(0)').on('click', function(ev) {
            isOpen = false;
            ev.preventDefault();
            ev.stopPropagation();
            $this = $(this);
            $this.removeClass('show');
            var pai = $this.parent().removeClass('large');
            TweenMax.to(pai, .5, {opacity: .5, onComplete: relayout, onCompleteParams: [$container], onUpdate: relayout, onUpdateParams: [$container]});
        });
    }
});

function relayout(container)
{
    container.isotope('reLayout');
}

function my_button_jquery(scope)
{
    scope.find('.yeahh').on('click', function(){
        console.log("Clicou no yeahhh!!!");
    });
}
