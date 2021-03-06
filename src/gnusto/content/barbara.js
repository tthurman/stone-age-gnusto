// barbara.js || -*- Mode: Java; tab-width: 2; -*-
// Lightweight lower-window handler.
//
// $Header: /cvs/gnusto/src/gnusto/content/barbara.js,v 1.38 2005/02/09 04:45:50 naltrexone42 Exp $
//
// Copyright (c) 2003 Thomas Thurman
// thomas@thurman.org.uk
// 
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have be able to view the GNU General Public License at 
// http://www.gnu.org/copyleft/gpl.html ; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

////////////////////////////////////////////////////////////////
//
//                     PRIVATE VARIABLES
//
////////////////////////////////////////////////////////////////

// The HTML <span> which we're adding text to at present.
// Can be null, if there isn't one.
var barbara__holder = null;

// Namespace of HTML. Constant.
var barbara__HTML = "http://www.w3.org/1999/xhtml";

// CSS string to be used as the value of the "style" element
// when we next create barbara__holder, in case that's null.
var barbara__current_css = '';

// The portion of the current command-line before the cursor.
var barbara__before_cursor = null;

// The portion of the current command-line after the cursor.
var barbara__after_cursor = null;

// Y-coordinate of the most the user's seen, in pixels.
// (For example, when the screen's cleared, this becomes 0px.)
var barbara__most_seen = 0;

var barbara__last_width = 0;

var barbara_zalphabet = {
		0: 'abcdefghijklmnopqrstuvwxyz',
		1: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		2: 'T\n0123456789.,!?_#\'"/\\-:()', // T = magic ten bit flag
}


////////////////////////////////////////////////////////////////

function barbara_init() {
		// Nothing yet
}

////////////////////////////////////////////////////////////////
//
// barbara_start_game
//
// Called at the start of a game.
//
function barbara_start_game() {

		barbara__holder = null;

		barbara__before_cursor = null;
		barbara__after_cursor = null;

		barbara__most_seen = 0;
		barbara__last_width = window.innerWidth;
		
}

////////////////////////////////////////////////////////////////
//
// barbara_clear
//
// Clears the Barbara window and resets the whole background
// to the current CSS colours.
function barbara_clear() {
		bocardo_collapse();

		// Collapse the Barbara window by cloning it (but not its
		// children) and then killing the old one (including its
		// children). That's not only faster, it works around a
		// bug in Firebird (but not in Seamonkey).

		var oldBarbara = document.getElementById('barbara');
		var newBarbara = oldBarbara.cloneNode(0);
		oldBarbara.parentNode.replaceChild(newBarbara, oldBarbara);

		// Put the CSS in, both on the background and the actual
		// text box itself.

		document.getElementById('barbarabox').setAttribute('class',
																											 barbara__current_css);
		newBarbara.setAttribute('class',
														barbara__current_css);

		// Trash barbara__holder to force ourselves to create
		// a new one next time around.

		barbara__holder = null;

		// Reset the [MORE] handling.

		barbara__set_viewport_top(0);
		barbara__most_seen = 0;
		
		// The pre v4 screen model starts at the bottom.
		// So we should fill 
	        var zVersion = engine.getByte(0);
	        if (zVersion < 4) {  
	          var lines_to_hop = engine.getByte(0x20);                
	          for (var i=1; i <= lines_to_hop; i++){
                    barbara_chalk('\n');	          	
                  }
                  var char_sizes = bocardo_get_font_metrics();  
                  barbara__most_seen = lines_to_hop * char_sizes[1];		                    
	        } else {
	          barbara_chalk('\n'); // FIXME: UGLY hack until bug 4206 is fixed	
	        }
		
}

////////////////////////////////////////////////////////////////

function barbara_set_text_style(css_class) {
		barbara__holder = null;
		barbara__current_css = css_class;
}

////////////////////////////////////////////////////////////////

function barbara_set_input(textlist) {

    var tty = document.getElementById('barbara');

		if (!barbara__before_cursor) {
				barbara__before_cursor =
						document.createElementNS(barbara__HTML,
																		 'html:span');
				barbara__before_cursor.
						setAttribute('id','beforecursor');
				barbara__before_cursor.
				                setAttribute('class',barbara__current_css);
				barbara__before_cursor.
								appendChild(document.createTextNode(''));

				tty.appendChild(barbara__before_cursor);
		}

		if (!barbara__after_cursor) {
				barbara__after_cursor =
						document.createElementNS(barbara__HTML,
																		 'html:span');
				barbara__after_cursor.
						setAttribute('id','aftercursor');
				barbara__after_cursor.
								appendChild(document.createTextNode(''));

				tty.appendChild(barbara__after_cursor);
		}

		barbara__before_cursor.childNodes[0].data = textlist[0];
		barbara__after_cursor .childNodes[0].data = textlist[1];
}


function barbara_print_status() {
	  try {
	        var zVersion = engine.getByte(0);
	        if (zVersion < 4) {                  
	          win_clear(1);
                  win_set_top_window_size(1);	          	
                  bocardo_gotoxy(1,0,0);
                  win_set_text_style(1,0,0);
                  bocardo_chalk(1,engine.getStatusLine(bocardo_get_screen_size()[0]));                  
                  win_set_text_style(0,0,0);
	        }
	  } catch(e) { }	
}
function barbara_get_input() {
 	        //barbara_print_status();
		return [
						barbara__before_cursor.childNodes[0].data,
						barbara__after_cursor.childNodes[0].data,
						];
}

function barbara_force_upper_window_reflow() {
    var tty = document.getElementById('barbara');

    var tempElement =
    document.createElementNS(barbara__HTML,'html:span');
    tempElement.setAttribute('id','tempElement');
    tempElement.appendChild(document.createTextNode(''));

    tty.appendChild(tempElement);	
    tty.removeChild(tempElement);
}

function barbara_destroy_input() {
    var tty = document.getElementById('barbara');
		tty.removeChild(barbara__before_cursor);
		tty.removeChild(barbara__after_cursor);

		barbara__before_cursor = 0;
		barbara__after_cursor = 0;
}

////////////////////////////////////////////////////////////////

var barbara__previous_monospace = 0;

function barbara_chalk(text, monospace) {

		if (!barbara__holder ||
				monospace!=barbara__previous_monospace) {

				// Create a new holder.

				barbara__holder =
						document.createElementNS(barbara__HTML,
																		 'html:span');

				var css = barbara__current_css;

				if (monospace) css = css + ' sm';

				barbara__holder.setAttribute('class', css);

				var temp = document.getElementById('barbara');
				temp.appendChild(barbara__holder);
		}

		barbara__previous_monospace = monospace;

		// Replace alternate spaces with &nbsp;s so that Gecko
		// won't collapse them.
		var lines = text.
				replace('  ',' \u00A0','g').
				split('\n');

		for (var i in lines) {
				if (i!=0) {
						var temp = document.createElementNS(barbara__HTML,
																										 'html:br');
						barbara__holder.appendChild(temp);
				}

				barbara__holder.
						appendChild(document.createTextNode(lines[i]));
		}
		
	        // After each chalk may not be the best place to be painting the status bar 
	        // in pre v5 games.  Very much open to suggestions.  But it seems semi-logical
	        // to me, and I can't yet think of a better place.  So here goes. -eric
                barbara_print_status();
		
}

////////////////////////////////////////////////////////////////

function barbara_relax() {

		var page_height = barbara__get_page_height();

		if (page_height < barbara__get_viewport_height()) {
				// Then we haven't started scrolling yet.
				// barbara__most_seen is now the page height, of course.

				barbara__most_seen = page_height;
				barbara__set_more(0);

		} else {
				// The lower screen scrolls by some amount.

				var slippage = page_height - barbara__most_seen;

				if (slippage > (barbara__get_viewport_height()- bocardo_get_top_window_height())) {
						// More than a screenful. Scroll to the top...
						barbara__set_viewport_top(barbara__most_seen-(bocardo_line_height()*2));
						barbara__set_more(1);
				} else {
						// Jump straight to the bottom. No problem.
						barbara__set_viewport_top(page_height);
						barbara__set_more(0);
				}

				// This implies collapsing the upper screen (see bug 4050).
				bocardo_collapse();
				barbara_print_status();
				reset_bocardobox_top();
		}
}

// This is a relax triggered by the user resizing the gnusto container window
function barbara_resize_relax() {

                if (window.innerWidth < barbara__last_width) {
                    bocardo_trim_upper_window_to_fit();
                }
                
		var page_height = barbara__get_page_height();
		

		if (page_height < barbara__get_viewport_height()) {
				// Then we haven't started scrolling yet.
				// barbara__most_seen is now the page height, of course.
				barbara__most_seen = page_height;
				barbara__set_viewport_top(page_height);
				
				// reset more to prevent lockup
				barbara__set_more(0);

	        } else {
		                // most_seen should change if the width of the screen changes,
		                // so we should scale it.  This will NOT be perfect, but should
		                // only really be an issue if we're paused for more.
		                barbara__most_seen = barbara__most_seen * (window.innerWidth / barbara__last_width);
		  
				// The lower screen is adjusted by some amount
                                if (!barbara__more_waiting) {
                                  barbara__set_viewport_top(page_height - (barbara__get_viewport_height() - bocardo_get_top_window_height() ));
                                  barbara__most_seen = page_height;
                                } else {
                                  barbara__set_viewport_top(barbara__most_seen - (barbara__get_viewport_height() - bocardo_get_top_window_height() ));
                                }
                                
		}
		barbara__last_width = window.innerWidth;
                // reprint status based on new window width
		barbara_print_status();
		reset_bocardobox_top();
		
}
////////////////////////////////////////////////////////////////

var barbara__more_waiting = false;

function barbara__set_more(whether) {

		// burin('more?', whether?'yes':'no');

		barbara__more_waiting = whether;

		if (whether) {
				win_show_status('Press any key for more...');
		} else {
				win_show_status('');
		}
}

function barbara_show_more() {

		// You shouldn't call this if there's no [MORE], but we'll
		// check anyway...
		if (!barbara__more_waiting) return;

		barbara_relax();
}

////////////////////////////////////////////////////////////////

function barbara_waiting_for_more() {
		return barbara__more_waiting;
}

////////////////////////////////////////////////////////////////

// Let's assume that the values used in scrolling are twips.
function barbara__twips_per_pixel() {

		// There's no way to find the number of twips per pixel as such.
		// What we can do, though, is get the size of something in pixels
		// and then in twips (actually, in centimetres), and divide.

		var PIXELS = 5;
		var CENTIMETRES = 6;
		var TWIPS_PER_CENTIMETRE = 567;

		var b = window.getComputedStyle(document.getElementById('barbarabox'),
																		null).
				getPropertyCSSValue('height');

		var centimetre_height = b.getFloatValue(CENTIMETRES);
		var pixel_height = b.getFloatValue(PIXELS);

		if (pixel_height==0) {
				return 15; // complete guess, but better than crashing
		} else {
				return (centimetre_height * TWIPS_PER_CENTIMETRE) /
						pixel_height;
		}
}

function barbara__get_viewport_top() {

		var cx = new Object();
		var cy = new Object();
		barbara__viewport().getPosition(cx, cy);

		return cy.value / barbara__twips_per_pixel();
}

function barbara__set_viewport_top(y) {
		barbara__viewport().scrollTo(0, y*barbara__twips_per_pixel());

		var new_top = barbara__get_viewport_top();
		barbara__most_seen = new_top + barbara__get_viewport_height();	
			
                reset_bocardobox_top();
}

function reset_bocardobox_top() {
                document.getElementById('bocardobox').setAttribute('top', barbara__get_viewport_top());
                barbara_force_upper_window_reflow()                
}

function barbara__get_viewport_height() {
		return win_get_dimensions()[1];
}

function barbara__get_viewport_width() {
		return win_get_dimensions()[0];	
}

function barbara__get_page_height() {
		return parseInt(document.
										defaultView.
										getComputedStyle(document.getElementById('barbara'),'').
										getPropertyValue('height'));
}

function barbara__viewport() {
		var scrollable = document.getElementById('barbarabox').boxObject;
		return scrollable.QueryInterface(Components.interfaces.nsIScrollBoxObject);
}


// Removes |count| characters from the end of the text and
// returns them.
function barbara_recaps(count) {

		if (count==0) return '';

		// The loop of this function rarely runs, and so
		// is optimised for readability rather than speed.

		var result = '';
		var barb = document.getElementById('barbara');

		while (result.length < count && barb.childNodes.length!=0) {
				var barbLast = barb.lastChild;

				if (barbLast.childNodes.length==0) {
						barb.removeChild(barbLast);
				} else {
						var barbLastText = barbLast.lastChild;

						if (barbLastText.data) {
								if (barbLastText.data.length==0) {
										barbLast.removeChild(barbLastText);
								} else {
										result = barbLastText.data[barbLastText.data.length-1] + result;
										barbLastText.data = barbLastText.data.substring(0, barbLastText.data.length-1);
								}
						}
				}
		}

		// Destroy the holder; it's likely we've corrupted
		// its value. It's only a cache, so it'll
		// get regenerated next time we print anything.
		barbara__holder = null;

		return result;
}

////////////////////////////////////////////////////////////////
var BARBARA_HAPPY = 1;
////////////////////////////////////////////////////////////////
