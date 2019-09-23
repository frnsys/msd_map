from cairosvg import svg2png

# 1 through 8
for i in range(1, 9):
    size = 24/i
    radius = i/6
    svg = "<svg height='{size}' width='{size}'> <circle cx='{c}' cy='{c}' r='{radius}' fill='#000000' /> </svg>".format(
        size=size, c=size/2, radius=radius)
    svg2png(bytestring=svg.encode('utf8'), write_to='patterns/{}.png'.format(i))