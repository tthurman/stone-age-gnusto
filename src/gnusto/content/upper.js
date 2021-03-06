// gnusto-lib.js || -*- Mode: Java; tab-width: 2; -*-
// upper.js -- upper window handler.
//
// $Header: /cvs/gnusto/src/gnusto/content/upper.js,v 1.57 2005/02/09 22:49:03 naltrexone42 Exp $
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

var bocardo__screen_doc = 0;
var bocardo__screen_window = 0;
var bocardo__current_x = [];
var bocardo__current_y = [];
var bocardo__top_window_height = 0;

var bocardo__screen_width = 80; //  a good default size
var bocardo__screen_height = 25; // a good default size

// Cached result of bocardo_get_font_metrics(); we assume that
// the sizes of monospace characters don't change during a run.
var bocardo__font_metrics = null;

////////////////////////////////////////////////////////////////

// Called on startup.
function bocardo_init() {
		bocardo_get_font_metrics();
}

////////////////////////////////////////////////////////////////
// bocardo__clear
//
// Removes all children of a DOM node.
function bocardo__clear(node) {
    while (node.childNodes.length!=0) {
        node.removeChild(node.childNodes[0]);
    }
}

////////////////////////////////////////////////////////////////
// bocardo_start_game
//
// Called before a game starts.
function bocardo_start_game() {

    bocardo__screen_doc = document;

    bocardo__screen_window = bocardo__screen_doc.getElementById('bocardo');
    bocardo__clear(bocardo__screen_window);

    bocardo__current_x = [];
    bocardo__current_y = [];
    bocardo__current_x[0] = bocardo__current_y[0] = 0;
    bocardo__current_x[1] = bocardo__current_y[1] = 0;

    bocardo_set_top_window_size(0);
}

////////////////////////////////////////////////////////////////

function bocardo_get_font_metrics() {

		if (!bocardo__font_metrics) {

				var charsAcross = 10;
				var charsDown = 3;

				var b = document.getElementById('fontsize');
				b.setAttribute('hidden','false');
				bocardo__font_metrics = [b.boxObject.width / charsAcross,
																b.boxObject.height / charsDown];
				b.setAttribute('hidden','true');
		}

		return bocardo__font_metrics;
}

////////////////////////////////////////////////////////////////

function bocardo_set_screen_size(width, height) {
		bocardo__screen_width = width;
		bocardo__screen_height = height;
}

function bocardo_get_screen_size() {
		return [bocardo__screen_width,bocardo__screen_height];
}

////////////////////////////////////////////////////////////////

var bocardo__screen_scroll_count = 0;

function bocardo_relax() {
		bocardo__screen_scroll_count = 0;
}

/////////////////////////////////////////////////////////////////

function bocardo_trim_upper_window_to_fit() {
    // process each row in the upper window
    for (var row = 0; row < bocardo__screen_window.childNodes.length; row++) {
    	var current_line = bocardo__screen_window.childNodes[row];
    	var cursor = 0;
    	var charactersSeen = 0;
   	// walk through the nodes on this row to find the one (if any) that crosses the edge of the screen
      	while (
      	         (cursor < current_line.childNodes.length) && 
      	         (
      	            (charactersSeen + current_line.childNodes[cursor].getAttribute('value').length) <= bocardo__screen_width
      	          )
      	       ) {
			charactersSeen += current_line.childNodes[cursor].getAttribute('value').length;
			cursor++;
	}
	 
        if (cursor < current_line.childNodes.length) { // if we determined that the row is wider than the window
            current_line.childNodes[cursor].setAttribute('value',
				current_line.childNodes[cursor].getAttribute('value').substring(0,bocardo__screen_width-charactersSeen));
	    for (var NodeIndex = current_line.childNodes.length-1; NodeIndex > cursor; NodeIndex--) {
	      current_line.removeChild(current_line.childNodes[NodeIndex]);
	    }
        }
        
    }
}

////////////////////////////////////////////////////////////////
function bocardo_chalk(win, text) {

		var paused_for_more = 0;

    // This function is written in terms of bocardo__subchalk(). All *we*
    // have to do is split up |text| so that it never goes
    // over the edge of the screen, and break at newlines.

		// Subfunction to move to the next line (whatever that means,
		// depending on which window we're on.)
		function newline() {
				bocardo__current_x[win] = 0;

				bocardo__current_y[win]++;

				if (win==0) {

						bocardo__screen_scroll_count++;
						
						// Do we need to stop and write [MORE]?

						if (bocardo__screen_scroll_count >= bocardo__screen_height-bocardo__top_window_height) {
								// Yes. Reset the scroll count.
								bocardo__screen_scroll_count = 0;
										
								// Reconstruct the message...
								message = message + text.slice(line,text.length).join('\n');

								paused_for_more = 1;
						} else {

								while (bocardo__current_y[0]>=bocardo__screen_height) {
										
										// We hit the bottom of the lower window.
										// Try for a scroll.
								
										bocardo__screen_window.removeChild(bocardo__screen_window.childNodes[bocardo__top_window_height]);
										bocardo__current_y[0]--; // Get back onto the screen
								}
						}

				} else if (win==1 && bocardo__current_y[1]==bocardo__top_window_height) {
						// We hit the bottom of the top window.
						// The z-spec leaves the behaviour undefined, but suggests
						// that we leave the cursor where it is. Frotz's behaviour
						// is more easy to mimic: it simply wraps back to the top.

						bocardo__current_y[1] = 0;
				}
		}

		////////////////////////////////////////////////////////////////

    text = text.toString().split('\n');

    for (var line in text) {

				var message = text[line];

				do {
					
						// sanity check to prevent negative index
						if ((bocardo__screen_width - bocardo__current_x[win]) < 0) bocardo__current_x[win] = bocardo__screen_width - message.length;
						if (bocardo__current_x[win] < 0) bocardo__current_x[win] = 0;

						if (message.length > (bocardo__screen_width - bocardo__current_x[win])) {

								//kludge for the moment -- really nobody should be writing off the edge of 
								//the upper window anyway								
								bocardo__current_x[win] -= ((bocardo__current_x[win] + message.length) - bocardo__screen_width);
								var amount = message.length;
								// The message is longer than the rest of this line.

								//var amount = bocardo__screen_width - bocardo__current_x[win];
								
								// Fairly pathetic wordwrap. FIXME: replace later
								// with a better dynamic programming algorithm.
								
								/*while (amount!=0 && message[amount]!=' ') {
										amount--;
								}
					
								if (amount==0) {
										// ah, whatever, just put it back and forget the
										// wordwrap.
										amount = bocardo__screen_width - bocardo__current_x[win];
								}*/

								bocardo__subchalk(win, message.substring(0, amount));
								
								message = message.substring(amount+1);

								newline();
								if (paused_for_more) return message;
						} else {
								
								// The message is shorter.

								bocardo__subchalk(win, message);
								bocardo__current_x[win] += message.length;
								message = '';
						}
				} while (message!='' && !paused_for_more);

				if (line<text.length-1) {
						newline();
						if (paused_for_more) return message;
				}
    }

		return ''; // We didn't have to scroll more than a screenful.
}

////////////////////////////////////////////////////////////////

function bocardo_gotoxy(win, x, y) {
		bocardo__current_x[win] = x;
		bocardo__current_y[win] = y;
}

function bocardo_char_at(x,y) {
    	if (y > bocardo__screen_window.childNodes.length) return ' ';
  
    	var current_line = bocardo__screen_window.childNodes[y];

    	var spans = current_line.childNodes;

	var charactersSeen = 0;
	var cursor = 0;

	// Go past all the spans before us.

        // Don't forget that the sum of the lengths is effectively 1-based whereas the indexing is 0 based
	while ((cursor<current_line.childNodes.length) && 
		    ((charactersSeen+current_line.childNodes[cursor].getAttribute('value').length) <= x)) {
				charactersSeen += current_line.childNodes[cursor].getAttribute('value').length;
				cursor++;
	}
	 
	//if we're off the end of the line, return a blank 
	if ((cursor >= current_line.childNodes.length) || (x > (charactersSeen + current_line.childNodes[cursor].getAttribute('value').length))) 
	  return ' ';
	
	//elsewise, return the char in question:
	return current_line.childNodes[cursor].getAttribute('value')[x-charactersSeen];
}

function bocardo_getx(win) {
		return bocardo__current_x[win];	
}

function bocardo_gety(win) {
		return bocardo__current_y[win];	
}

////////////////////////////////////////////////////////////////

function bocardo_set_top_window_size(lines) {
		bocardo__top_window_height = lines;

                var char_sizes = bocardo_get_font_metrics();
		var lines_to_shift = Math.floor(lines - (barbara__get_page_height() / char_sizes[1]));
  		for (i=0; i< lines_to_shift;i++)
  			barbara_chalk('\n');	
		//bocardo_gotoxy(1, 0, 0); //not required?
}

function bocardo_get_top_window_height() {
                var char_sizes = bocardo_get_font_metrics();
		var top_window_height = Math.floor(bocardo__top_window_height * char_sizes[1]);

                return 	top_window_height;
}

function bocardo_line_height() {
              var char_sizes = bocardo_get_font_metrics();
	      return char_sizes[1];
  	
}
////////////////////////////////////////////////////////////////

// Clears a window. |win| must be a valid window ID.
function bocardo_clear(win) {

		/****************************************************************/

		while (bocardo__screen_window.childNodes.length!=0) {
				bocardo__screen_window.removeChild(bocardo__screen_window.childNodes[0]);
		}

		bocardo__current_x[win] = 0;
		bocardo__current_y[win] = 0;

		/* not sure about this bit
		if (win==1) {
				// Clearing a window resets its "more" counter.
				bocardo__screen_scroll_count = 0;
				var body = bocardo__screen_doc.getElementsByTagName('body')[0];
				body.setAttribute('class', 'b' + bocardo__current_background);
				}*/
}

////////////////////////////////////////////////////////////////

// Prints an array of strings, |lines|, on window |win|.
// The first line will be printed at the current
// cursor position, and each subsequent line will be printed
// at the point immediately below the previous one.

function bocardo_print_table(win, lines) {

	if (win==1) {
		var temp_x = bocardo__current_x[win];
		var temp_y = bocardo__current_y[win];

		for (i=0; i<lines.length; i++) {
				bocardo__current_x[win] = temp_x;
				bocardo__current_y[win] = (temp_y+i) % bocardo__screen_height;

				if (lines[i].length + temp_x > bocardo__screen_width) {
						lines[i] = lines[i].substring(bocardo__screen_width-temp_x);
				}

				bocardo_chalk(win, lines[i]);
		}
	} else {
		for (i=0; i<lines.length; i++) {

				barbara_chalk(lines[i]);
		}
		
	}
        bocardo_trim_upper_window_to_fit();
}

////////////////////////////////////////////////////////////////

var bocardo__current_css = '';

function bocardo_set_text_style(css) {
		bocardo__current_css = css;
}

////////////////////////////////////////////////////////////////
//
//                      Private functions
//
////////////////////////////////////////////////////////////////

function bocardo__subchalk(win, text) {

		var x = bocardo__current_x[win];
		var y = bocardo__current_y[win];

    // Let's get a handle on the line we want to modify.

    // If the line doesn't yet exist, we must create it.
    // FIXME: possibly this will become redundant when we handle
    // dynamic screen resizing.
    while (bocardo__screen_window.childNodes.length <= y) {
				var newdiv = bocardo__screen_doc.createElement('hbox');
				var dummySpan = bocardo__screen_doc.createElement('description');
				dummySpan.setAttribute('class', 'bocardo fb');
				dummySpan.setAttribute('value', ' ');
				newdiv.appendChild(dummySpan);

				// Commenting out for now, since I don't know what
				// the effect of this will be on the XUL
				//newdiv.setAttribute('style', 'width: 100%;');
				//// Possibly the line above will become redundant
				//// once bug 3658 is fixed.

				// *Possibly* not what we want any more for the upper window
				//newdiv.setAttribute('class', bocardo__current_css);
				bocardo__screen_window.appendChild(newdiv);
    }

    // We delete any bits of that line we're going to overwrite,
		// and work out where to insert the new span. The line consists of a
		// sequence of spans.
    var current_line = bocardo__screen_window.childNodes[y];

		var spans = current_line.childNodes;

		var charactersSeen = 0;
		var cursor = 0;

		// Go past all the spans before us.

                // Don't forget that the sum of the lengths is effectively 1-based whereas the indexing is 0 based
		while ((cursor<current_line.childNodes.length) && 
		    ((charactersSeen+current_line.childNodes[cursor].getAttribute('value').length) <= x)) {
				charactersSeen += current_line.childNodes[cursor].getAttribute('value').length;
				cursor++;
		} 

		// |cursor| is now either pointing at the point where we want to
		// write the current span, or at the span which contains that
		// point. In the latter case, we must break it.

		var charactersTrimmed = 0;
		var doppelganger = 0;
		var appendPoint = -1;

                // if we're pointing off the end of the line...
		if (cursor==current_line.childNodes.length) { // Then we're in position for our new span
                                // unless we've still come up short.  In that case add a padding span 
				if (charactersSeen < x) {
						// There aren't enough characters to go round. We
						// must add extra spaces to the start of the text.

						var padding = '';
                                               
						for (var i=0; i<(x-charactersSeen); i++) {
								padding = padding + ' ';
						}

                                                if (padding.length > 0) {
							var paddingspan = bocardo__screen_doc.createElement('description');
							paddingspan.setAttribute('class', 'bocardo fb');
							paddingspan.setAttribute('value', padding);
							current_line.appendChild(paddingspan);
						}
				}
				// and insert our new text.
				var newSpan = bocardo__screen_doc.createElement('description');
				newSpan.setAttribute('class', 'bocardo '+bocardo__current_css);
				newSpan.setAttribute('value', text);
				current_line.appendChild(newSpan);
				

  	        } else {
		                // we're pointing at the span that contains our insertion point                		                  
		
				if (charactersSeen < x) {
					
						// Our insertion point is not at the very beginning of this span.
						// We must split off the portion that comes before us.

						var amountToKeep = x - charactersSeen;

						if (text.length < current_line.childNodes[cursor].getAttribute('value').length-amountToKeep) {

								// The whole of the new text fits within this node.
								// So let's break off the part of the node that comes after our
								// new text and make it into its own node.
								doppelganger = current_line.childNodes[cursor].cloneNode(1);
								doppelganger.setAttribute('value',
										 doppelganger.getAttribute('value').
										 substring(amountToKeep+text.length));
								if (cursor<current_line.childNodes.length) {
							        	current_line.insertBefore(doppelganger, current_line.childNodes[cursor+1]);
							        } else {
							        	current_line.appendChild(doppelganger);	
							        }
						}

						charactersTrimmed =
								current_line.childNodes[cursor].getAttribute('value').length - amountToKeep;
	
	                                        // And trim the current span down to just the part before we start our new text
						current_line.childNodes[cursor].setAttribute('value',
												 current_line.childNodes[cursor].getAttribute('value').
												 substring(0, amountToKeep));

						// Shift the cursor up by one because we insert AFTER the 
						// first portion of this now-split span.
						cursor++;
						
						
				}

				appendPoint = cursor;

				if (cursor<current_line.childNodes.length) {
						// Delete any spans which are COMPLETELY overwritten by our span.
						var charactersDeleted = charactersTrimmed;
						var spansToDelete = 0;

						while ((cursor<current_line.childNodes.length) && 
						    ((charactersDeleted+current_line.childNodes[cursor].getAttribute('value').length) <= text.length)) {
								charactersDeleted += current_line.childNodes[cursor].getAttribute('value').length;
								cursor++;
								spansToDelete++;
						}

						// And trim the overlapped portion, if any, of any partially overwritten spans.
						if (cursor<current_line.childNodes.length) {
								current_line.childNodes[cursor].setAttribute('value',
											current_line.childNodes[cursor].getAttribute('value').
											substring(text.length-charactersDeleted));
						}
				}

				// Delete the spans which are underneath our text...
				for (var i=appendPoint; i<(appendPoint+spansToDelete); i++) {
						current_line.removeChild(current_line.childNodes[appendPoint]); // the others will slide up.
				}


			// ..and append our text.
			var newSpan = bocardo__screen_doc.createElement('description');
			newSpan.setAttribute('class', 'bocardo '+bocardo__current_css);
			newSpan.setAttribute('value', text);

			if (appendPoint == -1) {
					current_line.appendChild(newSpan);
			} else {
					current_line.insertBefore(newSpan, current_line.childNodes[appendPoint]);
			}

		}


}

////////////////////////////////////////////////////////////////

// Stuff concerned with fixing bug 4050:

var bocardo__seen_quote_box = 0;

// The upper window can be made smaller by the story, but usually it
// doesn't want the contents of the part that was removed to vanish,
// at least not until the next scroll of the lower screen.
// This function makes the contents of the removed part vanish.
// It should only be used in conjunction with Barbara (rather than
// when Bocardo is running both windows).
function bocardo_collapse() {
		if (bocardo__seen_quote_box) {
				bocardo__seen_quote_box = 0;
				while (bocardo__screen_window.childNodes.length >
							 bocardo__top_window_height) {
						bocardo__screen_window.
								removeChild(bocardo__screen_window.
														childNodes[bocardo__screen_window.
																			 childNodes.length-1]);
				}
		}
}

////////////////////////////////////////////////////////////////
//
// bocardo_record_seen_quote_box
//
function bocardo_record_seen_quote_box() {
		if (bocardo__screen_window.childNodes.length > bocardo__top_window_height) {
				bocardo__seen_quote_box = 1;
		}
}

////////////////////////////////////////////////////////////////
UPPER_HAPPY = 1;
////////////////////////////////////////////////////////////////
