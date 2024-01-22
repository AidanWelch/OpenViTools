# OpenViTools
OpenViTools based on the work of Ryan Pacini(https://ryanpacini.com/posts/vifileformat/) and those on the LavaG forum

This is very disorganized.  I was just experimenting with the file format
to see if I could pull out strings from Labview files, translate them and
reinject them.  It shouldn't be too difficult to get from this current state
to that, but I have left the job where I was using LabView, so I don't have
that much of an interest in finishing it.  If you're interested, you'll
probably want to read Ryan Pacini's article on the format, then follow along
in extract_labels.mjs.  You should be able to understand up to extracting the 
FPSE data (stored in unzippeddata and unzippeddatenew, yes I know this is 
terrible, I meant to clean it up long before others saw this but never got
around to it.)  You can then open the hexproj with ImHex, the data should 
match up with test2.xml, I've basically been comparing the data from there to
deduce what everything is.  It is not all accurate but is a starting point.

String notes:
- For some text:
- - Starts with "
- - Next byte is the length as a UInt8BE
- - Next is the string
- - The first byte following a string is 0x84
- - The next and last byte it $
- For other text:
- - Unknown what it starts with
- - The next byte is the length as UInt8BE
- - Then the string
- - Then it ends with 0x04 aka EOT or End of Text