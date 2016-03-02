"""
Get speed limits from TomTom API.
"""

import csv

def main():
	import csv
	with open('routedata.csv', 'wb') as csvfile:
	    spamwriter = csv.writer(csvfile, delimiter=',', quotechar='|', quoting=csv.QUOTE_MINIMAL)
	    spamwriter.writerow(['Spam'] * 5 + ['Baked Beans'])

if __name__ == "__main__":
	main()