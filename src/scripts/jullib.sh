jullib_Defined="yes" 

#alias integer='declare -i'
# julnum=$1
# Convert a Julian day number to its corresponding Gregorian calendar
# date.  Algorithm 199 from Communications of the ACM, Volume 6, No. 8,
# (Aug. 1963), p. 444.  Gregorian calendar started on Sep. 14, 1752.
# This function not valid before that.
jul2dat()
{
  local -i julnum=$1 j y d m
  (( j = julnum - 1721119 ))
  (( y = (((j<<2) - 1) / 146097) ))
  (( j = (j<<2) - 1 - 146097*y ))
  (( d = (j>>2) ))
  (( j = ((d<<2) + 3) / 1461 ))
  (( d = ((d<<2) + 3 - 1461*j) ))
  (( d = (d + 4)>>2 ))
  (( m = (5*d - 3)/153 ))
  (( d = 5*d - 3 - 153*m ))
  (( d = (d + 5)/5 ))
  (( y = (100*y + j) ))
  if (( m < 10 ))
  then
    (( m += 3 ))
  else
    (( m -= 9 ))
    (( y += 1 ))
  fi
  echo $y $m $d
} 

# yearTy y, monthTy m, dayTy d
# Convert Gregorian calendar date to the corresponding Julian day number
# j.  Algorithm 199 from Communications of the ACM, Volume 6, No. 8,
# (Aug. 1963), p. 444.  Gregorian calendar started on Sep. 14, 1752.
# This function is not valid before that.
dat2jul()
{
# 10# - Damit wird Basis 10 erzwungen und 09 ist nicht mehr illegal oktal
  local -i c ya y=10#$1 m=10#$2 d=10#$3 JULNUM
  if (( m > 2 ))
  then
    (( m -= 3 ))
  else
    (( m += 9 ))
    (( y -= 1 ))
  fi
  (( c = y / 100 ))
  (( ya = y-100*c ))
  (( JULNUM=((146097*c)>>2) + ((1461*ya)>>2) + (153*m + 2)/5 + d + 1721119 ))
  echo $JULNUM
} 

# h m > m
time2min()
{
   local -i min
   (( min = $1 * 60 + $2 ))
   echo $min
} 

# m > h m
min2time()
{
   local -i h m
   (( h = $1 / 60 ))
   (( m = $1 % 60 ))
   echo $h $m
}
