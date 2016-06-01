
//image data is the master data storage of the skin
var imageWriter = buildImageWriter(64, 32);

//our root matrix is what we modify when we want to move everything
var rootTransMatrix = new M44();


function buildImageWriter(width, height) {
    var context = $('<canvas/>')
        .attr('width', width)
        .attr('height', height)
        .get(0).getContext('2d');

    var img = context.createImageData(width, height);
    img.setPixel = function (x, y, color) {
        this.setPixels([{x:x,y:y,color:color}])
        }

    img.setPixels = function (pixels) {
        
        for (var i = 0; i < pixels.length; i++) {
            x = pixels[i].x;
            y = pixels[i].y;
            color = pixels[i].color
            var red, green, blue, alpha = 1;
            var color = $('<div/>').css('background-color', color).css('background-color');
            if (color == 'transparent') {
                alpha, red, green, blue = 0;
            
            }
            else{
                var result = /^rgb(a)?\((.*?),(.*?),(.*?)(,(.*?))?\)$/.exec(color);

                red = parseInt(result[2]);
                green = parseInt(result[3]);
                blue = parseInt(result[4]);
                alpha = parseFloat(result[6] || '1');
            }
        

            var index = (x + y * this.width) * 4;
            this.data[index + 0] = red;
            this.data[index + 1] = green;
            this.data[index + 2] = blue;
            this.data[index + 3] = Math.floor(alpha * 255);
        }
        $(this).trigger('pixelsSet', [pixels]);
    }
    return img;
}

function buildImageReader(image) {
    var context = $('<canvas/>')
        .attr('width', image.width)
        .attr('height', image.height)
        .get(0).getContext('2d');

    context.drawImage(image, 0, 0);
    imgReader = context.getImageData(0, 0, image.width, image.height);
    var pad = function pad(number, length) {
        var str = '' + number;
        while (str.length < length) str = '0' + str;
        return str;
    }
    imgReader.getPixel = function (x, y) {
        index = (x + y * this.width) * 4;
        var red = this.data[index + 0];
        var green = this.data[index + 1];
        var blue = this.data[index + 2];
        var alpha = this.data[index + 3] / 255;

        return 'rgba(' + red + ', '+ green + ', ' + blue + ', ' + alpha + ')';
    }

    return imgReader;
}


function parseBool(string) {
    switch ((string || '').toLowerCase()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: case'': return false;
        default: return Boolean(string);
    }
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

//Building the 3d models
$(document).ready(function () {
    $('.block').each(buildBlock);

    $('#PreviewModel .block').click(function () {
        $(this).siblings().removeClass('selected');

        var $mainModel = $('#MainModel').empty();
        $(this).clone().appendTo($mainModel).attr('data-b-translateX', '0').attr('data-b-translateY', '0').each(buildBlock);

        $(this).addClass('selected');

    });

    

    function buildBlock() {
        $(this).remove('.cell.template');
        var sampleCell = $('<div/>').addClass('cell template').hide().appendTo(this);

        //it is important cells are square, the sizing depends on it
        var borderLeft = parseInt(sampleCell.css('border-left-width'));
        var borderRight = parseInt(sampleCell.css('border-right-width'));
        var bSize = sampleCell.width() + borderLeft + borderRight;

        var $this = $(this);

        //calculate the width, height and depth of hte block
        var bDepth = parseInt($this.attr('data-b-depth') || 1);
        var bWidth = parseInt($this.attr('data-b-width') || 1);
        var bHeight = parseInt($this.attr('data-b-height') || 1);
        var depth = bDepth * bSize;
        var width = bWidth * bSize;
        var height = bHeight * bSize;

        //calculate the transform of the block
        var bTranslateX = parseFloat($this.attr('data-b-translateX') || 0);
        var bTranslateY = parseFloat($this.attr('data-b-translateY') || 0);
        var bTranslateZ = parseFloat($this.attr('data-b-translateZ') || 0);
        var translateX = bTranslateX * bSize;
        var translateY = bTranslateY * bSize;
        var translateZ = bTranslateZ * bSize;

        var rootTransNode = new TransformNode(rootTransMatrix);
        var boxTransform = new TransformNode(new M44().translate(translateX, translateY, translateZ), rootTransNode);
        var box = new CSSCube(width, depth, height, boxTransform);

        //we need to offset all our elements to make the 0,0 of the container the
        //center of rotation.
        var offset = {
            left: -width / 2,
            top: -height / 2
        };

        //Side elements need some additional offsets so that they will rotate
        //properly into place
        var sideOffset = {
            left: offset.left + (width / 2 - depth / 2),
            top: offset.top
        }

        //go through and create all our faces and attach them to the box
        //we need to apply width/hight and offset to make them show correctly
        box.faces[0].element = $(this)
                .children('.face.top')
                .width(width)
                .height(depth)
                .css(offset)
                .data('bWidth', bWidth)
                .data('bHeight', bDepth)
                .get(0);


        box.faces[1].element = $(this)
                .children('.face.bottom')
                .width(width)
                .height(depth)
                .css(offset)
                .data('bWidth', bWidth)
                .data('bHeight', bDepth)
                .get(0);

        box.faces[2].element = $(this)
                .children('.face.front')
                .width(width)
                .height(height)
                .css(offset)
                .data('bWidth', bWidth)
                .data('bHeight', bHeight)
                .get(0);

        box.faces[3].element = $(this)
                .children('.face.right')
                .width(depth)
                .height(height)
                .css(sideOffset)
                .data('bWidth', bDepth)
                .data('bHeight', bHeight)
                .get(0);

        box.faces[4].element = $(this)
                .children('.face.back')
                .width(width)
                .height(height)
                .css(offset)
                .data('bWidth', bWidth)
                .data('bHeight', bHeight)
                .get(0);


        box.faces[5].element = $(this)
                .children('.face.left')
                .width(depth)
                .height(height)
                .css(sideOffset)
                .data('bWidth', bDepth)
                .data('bHeight', bHeight)
                .get(0);


        $(this).data('CSSCube', box);


        //This is just an example of moving items out. This would be refactored into something
        //nicer when the exact movements of the pieces are known
        

        if ($this.is('.head')) {
            box.localTrans.mul(new M44().rotY(Math.PI / 5));
        }

        if ($this.is('.right-arm')) {
            box.localTrans
                    .mul(new M44().translate(-width / 2, height / 2, -depth / 2))
                    .mul(new M44().rotZ(Math.PI / 12))
                    .mul(new M44().translate(width / 2, -height / 2, depth / 2))
        }

        if ($this.is('.left-arm')) {
            box.localTrans
                    .mul(new M44().translate(width / 2, height / 2, -depth / 2))
                    .mul(new M44().rotZ(-Math.PI / 12))
                    .mul(new M44().translate(-width / 2, -height / 2, depth / 2))
        }


        //apply all our transforms
        box.applyTransform();


        //add the individual cells
        $('.face', this).each(function () {

            /*var rowCount = $(this).data('bHeight');
            var colCount = $(this).data('bWidth');

            if ($('.cell', this).length == rowCount * colCount)
                return;

            $(this).empty();
            for (var row = 0; row < rowCount; row++) {
                for (var col = 0; col < colCount; col++) {
                    $("<div>")
                        .addClass('cell')
                        .addClass('cell-'+col+','+row).appendTo(this);
                }
            }*/
          
            var imageMapX = parseInt($(this).attr('data-image-map-x'));
            var imageMapY = parseInt($(this).attr('data-image-map-y'));
            var bWidth = $(this).data('bWidth');
            var bHeight = $(this).data('bHeight');
            var isMirrorX = parseBool($(this).attr('data-image-map-mirror-x'));
            var isMirrorY = parseBool($(this).attr('data-image-map-mirror-y'));

            if ($('.cell', this).length == bHeight * bWidth)
                return;

            for (var row = 0; row < bHeight; row++) {
                for (var col = 0; col < bWidth; col++) {
                    var x = imageMapX + (isMirrorX ? (bWidth - col - 1) : col);
                    var y = imageMapY + (isMirrorY ? (bHeight - row - 1) : row);
                   

                    $("<div>").addClass('cell')
                        .addClass('cell-' + x + '-' + y)
                        .appendTo(this);
                }
            }

           

        });

    };



});

//Handle model rotation
$(document).ready(function () {
    rotate((Math.PI / 6), 0);

    $('#MainSection, #SideSection').mousedown(function (ev) {
        if ($(ev.target).is('.cell'))
            return;
        $('body').addClass('unselectable');
        rotateAnchor = { x: ev.pageX, y: ev.pageY };

        $(document).mousemove(function (ev) {
            rotate(
                   (ev.pageY - rotateAnchor.y) / 100,
                   -(ev.pageX - rotateAnchor.x) / 100
                );
            rotateAnchor = { x: ev.pageX, y: ev.pageY };

        });
    });



    $(document).mouseup(function () {
        $(document).unbind('mousemove');
        $('body').removeClass('unselectable');
    });

    $(document).keydown(function (e) {
        switch (e.keyCode) {

            case 37: // left
                rotate(0, -0.1);
                break;

            case 38: // up
                rotate(0.1, 0);
                break;

            case 39: // right
                rotate(0, 0.1);
                break;

            case 40: // down
                rotate(-0.1, 0);
                break;
            default:
                return;
        };
    });

    function rotate(x, y) {
        var rotXMatrix = new M44().rotX(x);
        var rotYMatrix = new M44().rotY(y);

        rootTransMatrix.mul(new M44(rootTransMatrix), rotXMatrix);
        rootTransMatrix.mul(new M44(rootTransMatrix), rotYMatrix);

        $('.block').each(function () {
            $(this).data('CSSCube').applyTransform();
        });
    }


});

//update all views when image data changes
$(document).ready(function () {

    $(imageWriter).bind('pixelsSet', updateImage);

    $(imageWriter).bind('pixelsSet', function (e, pixels) {
        for (var i = 0 ; i < pixels.length; i++) {
            var x = pixels[i].x;
            var y = pixels[i].y;
            var color = pixels[i].color;
            $('.cell-' + x + '-' + y).css('background-color', color);
        }
       
    });



    var suppressImageUpdate = false;
    //update our image when the pixels are set. We do this after our initial load
    function updateImage(ev) {
        if (suppressImageUpdate)
            return;
        var canvas = $('<canvas/>').attr('width', this.width).attr('height', this.height).get(0);

        var context = canvas.getContext('2d');

        context.putImageData(imageWriter, 0, 0); // at coords 0,0
        var dataUrl = canvas.toDataURL('image/png');

        var img = $('#SkinImage')
                .attr('width', this.width)
                .attr('height', this.height)
                .attr('src', dataUrl).get(0);
    }

    $('#SkinLoader').load(function () {
        var img = this;
        suppressImageUpdate = true;
        var imageReader = buildImageReader(this);
        var rowsLeftToProcess = img.height;
        var startTime = new Date();

        for (var y = 0; y < img.height; y++) {

            setTimeout(function (y) {
                return function () {
                    var pixelsToSet = [];
                    for (var x = 0; x < img.width; x++) {
                        pixelsToSet.push({ x: x, y: y, color: imageReader.getPixel(x, y) });
                    }
                    imageWriter.setPixels(pixelsToSet);
                    if (--rowsLeftToProcess == 0) {
                        suppressImageUpdate = false;
                        updateImage.call(imageWriter);
                        $('#PreviewModel .block.head').click();
                    }
                }
            }(y), 0);
        }
      


    });
});

//Handle the drawing elemetns
$(document).ready(function () {

    var activeAction = function () {
        ($('.button.selected').data('action') || $.noop).apply(this, arguments);
    };

    $('.button.fill').data('action', function (e) {
        var $face = $(this).parent();
        var bWidth = $face.data('bWidth');
        var bHeight = $face.data('bHeight');

        var startColor = $(this).css('background-color');
        var cellsToPaint = [this];

        var currentCell;
        while (currentCell = cellsToPaint.pop()) {
            
            if ($(currentCell).css('background-color') == startColor){
                $('.button.paint').data('action').apply(currentCell, arguments);
                if ($(currentCell).css('background-color') == startColor)
                    return;
                var left = $(currentCell).prev().get(0);
                if (left && $(currentCell).prevAll().length % bWidth != 0)
                    cellsToPaint.push(left);

                var right = $(currentCell).next().get(0);
                if (right && $(currentCell).nextAll().length % bWidth != 0)
                    cellsToPaint.push(right);

                var top = $(currentCell).prevAll().get(bWidth-1);
                if (top) cellsToPaint.push(top);

                var bottom = $(currentCell).nextAll().get(bWidth-1);
                if (bottom) cellsToPaint.push(bottom);

            }
        }
    });

    $('.button.paint').data('action', function (e) {
        var $face = $(this).parent();
        var bWidth = $face.data('bWidth');
        var imageMapX = parseInt($face.attr('data-image-map-x'));
        var imageMapY = parseInt($face.attr('data-image-map-y'));
        var isMirrorX = parseBool($face.attr('data-image-map-mirror-x'));

        var index = $(this).prevAll('.cell').length;
        var x = index % bWidth;
        var y = Math.floor(index / bWidth);

        if (isMirrorX)
            x = bWidth - x - 1;

        x += imageMapX;
        y += imageMapY;

        var color = $(e.ctrlKey ? '#CtrlClickColor' : '#ClickColor').val()
        imageWriter.setPixel(x, y, color);
    });

    $('.button.color-dropper').data('action', function (e) {
        var color = $(this).css('background-color');
        $(e.ctrlKey ? '#CtrlClickColor' : '#ClickColor').miniColors('value', rgb2hex(color));
    });


    $(".face", '#MainModel').live('mousedown', function () {
        $(".face .cell", '#MainModel').live('mousemove', activeAction);
        $('body').addClass('unselectable');
    });

    $(document).mouseup(function () {
        $(".face .cell", '#MainModel').die('mousemove');
        $('body').removeClass('unselectable');
    });

    $('.cell', '#MainModel').live('click', activeAction);




    $('input.color-picker').miniColors();

    $('.button').click(function () {
        $('.button').not(this).removeClass('selected');
        $(this).addClass("selected");
    });

    var alreadyShifted = false
    $(document).keydown(function (e) {

        //shift key
        if (!alreadyShifted && e.keyCode == 16) {
            var $previousSelected = $('.button.selected');
            $('.button.color-dropper').click();
            var onKeyUp = function (e) {
                if (e.keyCode == 16) {
                    alreadyShifted = false;
                    $previousSelected.click();
                    $(this).unbind('keyup', onKeyUp);
                }
            };
            $(document).keyup(onKeyUp);
            alreadyShifted = true;
        }
    });

    

});

$(document).ready(function () {

    function isValidDrop(e) {
        var dataTransfer = e.originalEvent.dataTransfer;
        if (!dataTransfer)
            return false;

        var files = dataTransfer.files;

        if (!files || files.length != 1)
            return false;



        var file = files[0];

        if (!/^image*/i.test(file.type) || file.size > 8192)
            return false;

        return true;
    }


    $('#DropSection').bind('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!isValidDrop(e)) {
            alert("Try again, this time with a valid skin file");
            return;
        }


        var files = e.originalEvent.dataTransfer.files; // FileList object.
        var file = files[0];

        var reader = new FileReader();
        reader.onload = function (e) {
            $('#SkinLoader').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);

    });

    $('#DropSection').bind('dragover', function (e) {

        keepDrag();
        var isValid = isValidDrop(e)
        $(this).addClass('drop-allowed');


        e.originalEvent.dataTransfer.dropEffect = 'copy';
      
        e.stopPropagation();
        e.preventDefault();



    });


    $(document).bind('dragover', function (e) {

        $('#DropSection').removeClass('drop-allowed');
        keepDrag();

        e.originalEvent.dataTransfer.dropEffect = 'none'
        e.preventDefault();
        e.stopPropagation();

    });


    var undragTimeout;
    function keepDrag() {
        $('#Content').addClass('drag-drop');
        clearTimeout(undragTimeout);
        undragTimeout = setTimeout(function () {
            $('#Content').removeClass('drag-drop');
            $('#DropSection').removeClass('drop-allowed');
        }, 100);
    }


});









