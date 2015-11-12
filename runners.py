import cPickle
import os

import numpy as np
from scipy.stats import gaussian_kde
from scipy.spatial import KDTree

from courses import CourseHandicapper
from utils import DATA_DIR, get_logger, lazy_property

logger = get_logger(__name__)

DEFAULTS = {
    'first_name': '<no_first_name>',
    'last_name': '<no_last_name>',
    'team': '<no_team>',
}


class RunnerPriors(object):
    min_count = 10
    time_weight = np.array([2 ** -(0.5 * j) for j in range(min_count)][-1::-1])

    def __init__(self, course, gender='male', min_count=10):
        self.gender = gender
        self.min_count = min_count
        self.pkl_file = os.path.join(
            DATA_DIR,
            'priors_{}.pkl'.format(gender))
        self.course = course
        self.handicapper = CourseHandicapper(gender)

    @lazy_property
    def trees(self):
        trees = {}
        for j in range(self.min_count - 1):
            trees[j + 1] = KDTree(self.times[:, self.min_count - j - 2:self.min_count - 1])
        return trees

    @lazy_property
    def times(self):
        if os.path.exists(self.pkl_file):
            logger.info("Loading runner priors...")
            return cPickle.load(open(self.pkl_file, 'r'))
        else:
            raise ValueError("Cannot find file {}".format(self.pkl_file))

    def _predictor_function(self, times):
        predictor = gaussian_kde(times)
        return predictor.resample

    def predict_times(self, times):
        runner_times = times[-self.min_count + 1:]
        n_times = len(runner_times)
        tree = self.trees[n_times]
        _, idxs = tree.query(
            runner_times * self.time_weight[-n_times - 1:-1],
            100)
        pred_times = self.times[idxs, -1]
        return self._predictor_function(pred_times)
