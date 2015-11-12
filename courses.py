import cPickle
import os

from utils import DATA_DIR, get_logger, lazy_property

logger = get_logger(__name__)


class CourseHandicapper(object):

    def __init__(self, gender='male'):
        self.gender = gender
        self._to_idx = {}
        self._to_course = {}
        self._avg_times = {}
        self._n_courses = 0
        self.handicap_pkl = os.path.join(DATA_DIR, '{}_course_handicaps.pkl'.format(self.gender))
        self.lookup_pkl = os.path.join(DATA_DIR, '{}_lookups.pkl'.format(self.gender))

    @property
    def courses(self):
        self._build_lookups()
        return map(unicode, self._to_idx.iterkeys())

    def idx(self, course):
        self._build_lookups()
        return self._to_idx[course]

    def course(self, idx):
        self._build_lookups()
        return self._to_course[idx]

    @lazy_property
    def handicaps(self):
        if os.path.exists(self.handicap_pkl):
            logger.info("Loading {} course handicaps".format(self.gender))
            return cPickle.load(open(self.handicap_pkl, 'r'))
        else:
            raise ValueError("Cannot find file {}".format(self.handicap_pkl))

    def compare(self, course_one, course_two):
        return self.handicaps[self.idx(course_one), self.idx(course_two)]

    def _build_lookups(self):
        if not self._to_idx or not self._to_course or not self._avg_times:
            if os.path.exists(self.lookup_pkl):
                logger.info("Loading {} course lookup table".format(self.gender))
                self._to_idx, self._to_course, self._n_courses, self._avg_times = cPickle.load(
                    open(self.lookup_pkl, 'r'))
                to_idx, to_course = {}, {}
                for key, value in self._to_idx.iteritems():
                    to_idx[unicode(key)] = value
                for key, value in self._to_course.iteritems():
                    to_course[key] = unicode(value)
                self._to_idx = to_idx
                self._to_course = to_course
                return
            else:
                raise ValueError("Cannot find file {}".format(self.lookup_pkl))


class Course(object):
    def __init__(self, venue, city, state, distance):
        self.venue = venue
        self.city = city
        self.state = state
        self.distance = distance

    def _to_tuple(self):
        return (self.venue, self.city, self.state, self.distance)

    def __repr__(self):
        return u"{0.distance}m - {0.venue} at {0.city}, {0.state}".format(self)

    def __hash__(self):
        return hash(self._to_tuple())

    def __cmp__(self, other):
        return cmp(self._to_tuple(), other._to_tuple())
