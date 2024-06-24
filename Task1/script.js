$(function () {
    $(".btn-group img").click(function () {
        $(this).next().html(
            parseInt($(this).next().html()) + 1
        )
    })
})