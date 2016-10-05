Feature: Testing the tagged items.
  Testing that two nodes tagged to one term and only one node tagged to another
  term.

  @api @misc_first @javascript
  Scenario: verify that the tagged items filter work as expected.
      Given I am logging in as "admin"
        And I visit "john/classes"
        And I click "Add New"
        And I click "Class"
        And the overlay opens
        And I fill in "Title" with "Dummy class"
        And I press "Save"
        And the overlay closes
        And I click "Configure"
        And I click "Delete"
        And the overlay opens
       When I press "Delete"
        And the overlay closes
       Then I should verify i am at "john/classes"
