// mozilla-glue.js -- interface between gnusto-lib.js and Mozilla
//  Needs some tidying.
// $Header: /cvs/gnusto/src/gnusto/content/mozilla-glue.js,v 1.3 2003/02/04 21:39:40 marnanel Exp $
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

var lowerWindow = 0;
var tty = 0;
var current_text_holder = 0;
var current_window = 0;

function loadZcode(filename) {

	var zcode = new Components.Constructor(
							"@mozilla.org/file/local;1",
							"nsILocalFile",
   		  					"initWithPath")(filename);

	if (!zcode.exists())
		throw 'Zcode file '+filename+" doesn't exist.";

	var fc = new Components.Constructor(
							"@mozilla.org/network/local-file-channel;1",
						    "nsIFileChannel")();

	var sis = new Components.Constructor(
							"@mozilla.org/scriptableinputstream;1",
							"nsIScriptableInputStream")();

	fc.init(zcode, 1, 0);
	sis.init(fc.open());

	for (var i=0; i<zcode.fileSize; i++) {
		var b = sis.read(1);
		if (b.length==0)
			zbytes[i] = 0;
		else
			zbytes[i] = b.charCodeAt(0);
	}
}

function getbyte(address) {
	return zbytes[address];
}

function setbyte(value, address) {
	if (value<0) throw "too low "+value;
	if (value>255) throw "too high "+value;
	zbytes[address] = value;
}

function style_text(how) {
	if (current_window==0) {
		current_text_holder = 
			lowerWindow.createElement('span');
		current_text_holder.setAttribute('style', how);
		tty.appendChild(current_text_holder);
	}
}

function print_text(what) {
	if (what!='')
		current_text_holder.appendChild(
			lowerWindow.createTextNode(what));
}

function print_newline() {
	if (current_window==0) {
		current_text_holder.appendChild(
			lowerWindow.createElement('br'));
	} else if (current_window==1) {
		// fixme: have a method to do this inside upper
		u_x = 0;
		u_y = (u_y + 1) % u_height;
	} else
		throw "unearthly window "+current_window+' in print_newline';
}

function gnustoglue_output(what) {
	if (current_window==0) {
		// Lower window.

		var newline;

		while (what.indexOf && (newline=what.indexOf('\n'))!=-1) {
			print_text(what.substring(0, newline));
			what = what.substring(newline+1);
	
			print_newline();
		}

		print_text(what);
		
		window.frames[0].scrollTo(0, lowerWindow.height);

	} else if (current_window==1) {
		// Upper window.
		u_write(what);
		set_upper_window();
	} else
		throw "unearthly window "+current_window+' in gnustoglue_output';
}

function gnustoglue_set_text_style(style) {
	var styling = ''

	if (style!=0) {
		if (style & 0x1)
			// "reverse video", whatever that means for us
			styling = styling + 'background-color: #777777;color: #000000;';

		if (style & 0x2)
			// bold
			styling = styling + 'font-weight:bold;';

		if (style & 0x4)
			// italic
			styling = styling + 'font-style: italic;';

		if (style & 0x8)
			// monospace
			styling = styling + 'font-family: monospace;';
	}

	style_text(styling);
}

function gnustoglue_split_window(lines) {
	u_setup(80, lines);
	set_upper_window();
}

function gnustoglue_set_window(w) {
	if (w==0 || w==1)
		current_window = w;
	else
		throw "set_window's argument must be 0 or 1";
}

function gnustoglue_erase_window(w) {
	if (w==1)
		u_setup(u_width, u_height);
	else if (w==1)
		throw "Can't handle clearing lower window yet";
	else
		throw "erase_window's argument must be 0 or 1";
}

function gnustoglue_set_cursor(y, x) {
	if (current_window == 1) u_gotoxy(x, y);
}

// The reason that go_wrapper stopped last time. This is
// global because other parts of the program might want to know--
// for example, to disable input boxes.
var reasonForStopping = GNUSTO_EFFECT_WIMP_OUT; // safe default

function go_wrapper(answer) {

	var looping;
	
	do {
		looping = 0; // By default, we stop.

		reasonForStopping = go(answer);
		
		if (reasonForStopping == GNUSTO_EFFECT_WIMP_OUT) {
			// Well, just go round again.
			answer = 0;
			looping = 1;
		} else if (reasonForStopping == GNUSTO_EFFECT_INPUT) {
			// we know how to do this.
			// Just bail out of here.
		} else if (reasonForStopping == GNUSTO_EFFECT_INPUT_CHAR) {
			// similar
			alert('(warning: zmachine wants a character; not fully implemented)');
		} else if (reasonForStopping == GNUSTO_EFFECT_SAVE) {
			// nope
			alert("Saving of games isn't implemented yet.");
			answer = 0;
			looping = 1;
		} else if (reasonForStopping == GNUSTO_EFFECT_RESTORE) {
			// nope here, too
			alert("Loading saved games isn't implemented yet.");
			answer = 0;
			looping = 1;
		} else if (reasonForStopping == GNUSTO_EFFECT_QUIT) {
			alert("End of game.");
			// not really the best plan in the long term to close
			// the main window when the game asks for it, but
			// for now...
			window.close();
		} else
			// give up: it's nothing we know
			throw "gnusto-lib used an effect code we don't understand: 0x"+
					reasonForStopping.toString(16);
	} while (looping);

}

function set_upper_window() {
	var upper = document.getElementById("upper");

	while (upper.hasChildNodes())
		upper.removeChild(upper.lastChild);

	upper.appendChild(
			document.createTextNode(u_preformatted()));
}

function play() {
	lowerWindow = frames[0].document;
	tty = lowerWindow.getElementById('tty');

	u_setup(80,0);
	set_upper_window();

	style_text('');

	// Here we would
        //   loadZcode('/home/marnanel/proj/old/blorple/troll.z5');
	// if we could handle binary streams reliably yet.
	
	setup();
	go_wrapper(0);
}

function catcher(code) {
	// note: we may want to setTimeout(eval(code),10) or something similar
	// instead later, to give Moz a chance to catch up with displaying
	try {
		eval(code);
	} catch(e) {
		alert('-- gnusto error --\n'+code+'\n'+e);
		throw e;
	}
}

function gotInput(keycode) {
	if (keycode==13 && reasonForStopping==GNUSTO_EFFECT_INPUT) {
		var inputBox = document.getElementById("input");
		var value = inputBox.value;

		inputBox.value = '';
		
		gnustoglue_output(value+'\n');

		go_wrapper(value);
	}
}

function aboutBox() {
	// simple JS alert for now.
	alert('Gnusto v0.1.0\nby Thomas Thurman <thomas@thurman.org.uk>\n'+
	'Early prealpha\n\nhttp://gnusto.mozdev.org\nhttp://marnanel.org\n\n'+
	'Copyright (c) 2003 Thomas Thurman.\nDistrubuted under the GNU GPL.');
}

function quitGame() {
	window.close();
}
