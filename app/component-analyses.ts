export class ComponentAnalyses {

    private stackApiUrl: string;

    constructor() {
        this.stackApiUrl = 'http://bayesian-api-bayesian-staging.b6ff.rh-idev.openshiftapps.com/api/v1/';
    }

    buildComponentGrid = (dataSet: Array<any>) => {
        for (var i in dataSet) {
            var strToAdd = '<tr>' +
                '<td>' + dataSet[i].ghIssueClosedLastMnth + '</td>' +
                '<td>' + dataSet[i].ghIssueClosedLastYear + '</td>' +
                '<td>' + dataSet[i].ghIssueOpenedLastMnth + '</td>' +
                '<td>' + dataSet[i].ghIssueOpenedLastYear + '</td>' +
                '<td>' + dataSet[i].ghPrsClosedLastMnth + '</td>' +
                '<td>' + dataSet[i].ghPrsClosedLastYear + '</td>' +
                '<td>' + dataSet[i].ghPrsOpenedLastMnth + '</td>' +
                '<td>' + dataSet[i].ghPrsOpenedLastYear + '</td></tr>';
            $('#compTable tbody').append(strToAdd);
        }
    }

    formStackData = (compAnalysesArray: any) => {
        if (compAnalysesArray.length) {
            let dataSet: Array<any> = [];
            for (let i in compAnalysesArray) {
                let dataSetObj: any = {};
                dataSetObj.ghIssueClosedLastMnth = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghIssueClosedLastYear = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghIssueOpenedLastMnth = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghIssueOpenedLastYear = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghPrsClosedLastMnth = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghPrsClosedLastYear = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghPrsOpenedLastMnth = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSetObj.ghPrsOpenedLastYear = compAnalysesArray[i].package.gh_issues_closed_last_month[0];
                dataSet.push(dataSetObj);
            }
            this.buildComponentGrid(dataSet);
        }
    }

    buildComponentAnalyses = () => {
        let stackUri = this.stackApiUrl;
        let compAnalysesArray: Array<any>;
        let ecosystem: string = '';
        let component: string = '';
        let version: string = '';
        $('#compGridCntr').hide();
        $('#componentStatus').show();
        $('#stackbtn').on('click', () => {
            ecosystem = $("#ecosystem").val();
            component = $("#component").val();
            version = $("#version").val();
            $.ajax({
                url: stackUri + 'component-analyses/' + ecosystem + '/' + component + '/' + version,
                headers: {
                    'Content-Type': "application/json"
                },
                method: 'GET',
                success: response => {
                    if (response && response.result && response.result.result && response.result.result.data.length > 0) {
                        compAnalysesArray = response.result.result.data;
                        $('#compGridCntr').show();
                        $('#componentStatus').hide();
                        this.formStackData(compAnalysesArray);
                    } else {
                        $('#compGridCntr').hide();
                        $('#componentStatus').show();
                        $('#componentStatusMsg').text('No records found');
                    }
                },
                error: () => {
                    $('#compGridCntr').hide();
                    $('#componentStatus').show();
                    $('#componentStatusMsg').text('Failed to fetch the records');
                }
            });
        });
    }

}