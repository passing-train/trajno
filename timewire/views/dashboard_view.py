from timewire.core.database import get_window_data, get_process_data
from timewire.views.bar_graph import BarGraph
from timewire.views.base_view import BaseView
from timewire.views.pie_graph import PieGraph


# TODO: make a base class
class DashboardView(BaseView):
    def __init__(self):
        BaseView.__init__(self)
        self.bar_graph = None
        self.pie_graph = None

    def componentComplete(self):
        BaseView.componentComplete(self)
        self.bar_graph: BarGraph = self.findChild(BarGraph, "barGraph")
        self.bar_graph.horizontal = True
        self.pie_graph: PieGraph = self.findChild(PieGraph, "pieGraph")

        self.update()

    def update(self):
        BaseView.update(self)
        update_window_graph(self.pie_graph)
        update_process_graph(self.bar_graph)


def update_window_graph(graph):
    window_data = get_window_data()

    window_values = [x[2] for x in window_data]
    window_labels = [x[1].get_name_part(0) for x in window_data]

    window_values = window_values[:5] + [sum(window_values[5:])]
    window_labels = window_labels[:5] + ["Other"]

    graph.set_values(window_values)
    graph.set_labels(window_labels)
    graph.update()


def update_process_graph(graph):
    process_data = get_process_data()

    process_values = [x[1] for x in process_data]
    process_labels = [x[0].get_process_title() for x in process_data]

    process_values = process_values[:5] + [sum(process_values[5:])]
    process_labels = process_labels[:5] + ["Other"]

    graph.set_values(process_values)
    graph.set_labels(process_labels)
    graph.update()