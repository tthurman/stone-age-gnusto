// $Header: /cvs/gnusto/src/gnusto/content/gnusto-base.js,v 1.1 2004/04/12 03:49:46 marnanel Exp $
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

// This file contains the code to keep the XUL user interface
// talking to the component back-ends.
//
// Once, everything was done in chrome space, and there were no
// components. Gradually, code started migrating to component space,
// leaving a jumbled design in chrome space, which had worked once
// but was no good for the new reduced layout. So this file was
// created, into which the small amount of good code remaining in
// chrome space could be refactored before those files were sent
// to the bit bucket.
//
// One day, maybe even these functions should cross over into
// component space...
//
// Notable points of entry in this file:
//
//   - command_open() -- nyi
//
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
var GNUSTO_BASE_HAPPY = 1;
////////////////////////////////////////////////////////////////
