#!/usr/bin/env python
from drawille import Canvas, line
import curses
import math
from time import sleep
import locale
import os

locale.setlocale(locale.LC_ALL,"")

stdscr = curses.initscr()
stdscr.refresh()


a1 = 500.0
a2 = 220.0
a3 = 20.0
c1 = 0.11
c2 = 0.06
c3 = 0.12
w1 = 3.0
w2 = 4.25
w3 = 1.0
dw1 = 0.8
dw2 = -0.069
dw3 = -1.0
max_freq = 12.0
p1 = 0.0
p2 = 0.0
p3 = 0.0
dp1 = 0.0
dp2 = -0.0132
dp3 = 0.0
depth = 150.0
cycles = 3.0
resolution = 300

heightStr, widthStr = os.popen('stty size', 'r').read().split()
width = (int(widthStr)-1)*2
height = (int(heightStr)-1)*4

def render(c):
    for n in range(int(cycles * resolution)):
	i = float(n) / float(resolution)
	pow1 = math.pow(c1, i)
	pow2 = math.pow(c2, i)
	pow3 = math.pow(c3, i)
	x1 = a1 * pow1 * math.cos(math.pi*2*(i*w1 + p1))
	y1 = a1 * pow1 * math.sin(math.pi*2*(i*w1 + p1))
	x2 = a2 * pow2 * math.cos(math.pi*2*(i*w2 + p2))
	y2 = a2 * pow2 * math.sin(math.pi*2*(i*w2 + p2))
	x3 = a3 * pow3 * math.cos(math.pi*2*(i*w3 + p3))
	y3 = a3 * pow3 * math.sin(math.pi*2*(i*w3 + p3))
	x = 500*(x1 + x2 + x3)/width + width/2
	y = 250*(y1 + y2 + y3)/height + height/2
	if n != 0:
	    for px,py in line(prevx, prevy, x, y):
		c.set(px, py)
	prevx = x
	prevy = y


def update(c, deltaTime):
    global w1, w2, w3, dw1, dw2, dw3, p1, p2, p3, dp1, dp2, dp3
    w1 += dw1*deltaTime
    if w1 > max_freq:
	w1 = -max_freq
    elif w1 < -max_freq:
	w1 = max_freq
    w2 += dw2*deltaTime
    if w2 > max_freq:
	w2 = -max_freq
    elif w2 < -max_freq:
	w2 = max_freq
    w3 += dw3*deltaTime
    if w3 > max_freq:
	w3 = -max_freq
    elif w3 < -max_freq:
	w3 = max_freq
    p1 += dp1 * deltaTime
    p2 += dp2 * deltaTime
    p3 += dp3 * deltaTime


def __main__(stdscr, projection=False):
    c = Canvas()
    while 1:
	render(c)
	update(c, 0.1)

        #f = c.frame(0, 0, 180, 140)
        f = c.frame(0, 0, width, height)
        stdscr.addstr(0, 0, '{0}\n'.format(f))
        stdscr.refresh()

        sleep(1.0/20)
        c.clear()


if __name__ == '__main__':
    from sys import argv
    projection = False
    if '-p' in argv:
        projection = True
    curses.wrapper(__main__, projection)
