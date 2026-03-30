from PIL import Image, ImageDraw
size=512
bg="#E5EDF5"
icon=Image.new("RGBA",(size,size),bg)
d=ImageDraw.Draw(icon)
# head
d.ellipse((128,144,384,360),fill="#FBF7F0",outline="#23415F",width=18)
# eyes
for cx in (184,328):
    d.ellipse((cx-12,260-12,cx+12,260+12),fill="#23415F")
# smile
d.arc((206,300,306,344),0,180,fill="#23415F",width=12)
# curls
for x in (150,256,362):
    d.arc((x-50,118,x+50,188-20),180,360,fill="#23415F",width=16)
# scarf
d.polygon([(210,348),(240,420),(180,420)],fill="#F3B7B0")
d.polygon([(302,348),(332,420),(270,420)],fill="#F3B7B0")
icon.save('apps/mobile/assets/icon.png',optimize=True)
icon.save('apps/mobile/assets/adaptive-icon-foreground.png',optimize=True)
